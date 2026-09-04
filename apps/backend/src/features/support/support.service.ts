import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, TicketStatus, ConversationStatus, Role, AutomationMode } from "@prisma/client";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { SupportEvent } from "../../common/events/support-events";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";

function makeChannelId(key: string) {
  const random = Math.random().toString(36).slice(2, 8);
  return `ch_${key.replace(/[^a-z0-9]/g, "").slice(0, 12)}_${random}`;
}

type WidgetVisitorSettings = {
  collectVisitorInfo: boolean;
  visitorNameEnabled: boolean;
  visitorEmailEnabled: boolean;
  visitorPhoneEnabled: boolean;
};

const defaultWidgetVisitorSettings: WidgetVisitorSettings = {
  collectVisitorInfo: false,
  visitorNameEnabled: true,
  visitorEmailEnabled: true,
  visitorPhoneEnabled: false
};

const widgetChannelPublicSelect = {
  id: true,
  projectId: true,
  channelId: true,
  name: true,
  enabled: true,
  websiteUrl: true,
  welcomeMessage: true,
  colorTheme: true,
  logoUrl: true,
  collectVisitorInfo: true,
  visitorNameEnabled: true,
  visitorEmailEnabled: true,
  visitorPhoneEnabled: true,
  launcherPosition: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.WidgetChannelSelect;

function parseEmailList(value?: string | null) {
  return Array.from(
    new Set(
      (value ?? "")
        .split(/[\s,;]+/)
        .map((email) => email.trim())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
  );
}

function randomVisitorName(profileId: string, projectName?: string) {
  const clean = profileId.replace(/^guest-/, "").replace(/[^a-z0-9]/gi, "");
  const projectPrefix = (projectName || "supporthub")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);
  const code = clean.slice(0, 6).toUpperCase() || Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${projectPrefix || "supporthub"}-${code}`;
}

type DashboardRange = "today" | "week" | "month" | "all";

function dashboardDateFilter(range: DashboardRange = "all") {
  if (range === "all") return undefined;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (range === "week") {
    start.setDate(start.getDate() - 6);
  }

  if (range === "month") {
    start.setDate(1);
  }

  return { gte: start };
}

@Injectable()
export class CoreService {
  constructor(
    private db: PrismaService,
    private queues: QueueService,
    private realtime: RealtimeGateway,
    private crypto: CryptoService
  ) {}

  async assertMember(userId: string, projectId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === "ADMIN") return { id: "admin", projectId, userId, role: "ADMIN" as Role };
    const member = await this.db.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
    if (!member) throw new ForbiddenException("Project access denied");
    return member;
  }

  async assertProjectAdmin(userId: string, projectId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === "ADMIN") return;
    const member = await this.db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true }
    });
    if (member?.role !== "PROJECT_ADMIN") throw new ForbiddenException("Project admin access required");
  }

  async assertGlobalAdmin(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") throw new ForbiddenException("Admin access required");
  }

  projects(userId: string) {
    return this.db.user.findUnique({ where: { id: userId }, select: { role: true } }).then((user) =>
      this.db.project.findMany({
      where: user?.role === "ADMIN" ? {} : { members: { some: { userId } } },
      select: { id: true, name: true, key: true, widgetChannel: { select: { id: true, channelId: true, enabled: true } } }
    }));
  }

  async dashboardSummary(userId: string, range: DashboardRange = "all") {
    const projects = await this.projects(userId);
    const projectIds = projects.map((project) => project.id);
    const createdAt = dashboardDateFilter(range);
    const conversationWhere = { projectId: { in: projectIds }, ...(createdAt ? { createdAt } : {}) };
    const ticketWhere = { projectId: { in: projectIds }, ...(createdAt ? { createdAt } : {}) };

    if (!projectIds.length) {
      return {
        projectsCount: 0,
        conversationsCount: 0,
        openConversationsCount: 0,
        unreadConversationsCount: 0,
        ticketsCount: 0,
        openTicketsCount: 0,
        agentsCount: 0,
        activeChannelsCount: 0
      };
    }

    const [
      conversationsCount,
      openConversationsCount,
      unreadConversationsCount,
      ticketsCount,
      openTicketsCount,
      agentsCount,
      activeChannelsCount
    ] = await Promise.all([
      this.db.conversation.count({ where: conversationWhere }),
      this.db.conversation.count({ where: { ...conversationWhere, status: { not: "RESOLVED" } } }),
      this.db.conversation.count({ where: { ...conversationWhere, unreadCount: { gt: 0 } } }),
      this.db.ticket.count({ where: ticketWhere }),
      this.db.ticket.count({ where: { ...ticketWhere, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      this.db.projectMember.count({ where: { projectId: { in: projectIds } } }),
      this.db.widgetChannel.count({ where: { projectId: { in: projectIds }, enabled: true } })
    ]);

    return {
      projectsCount: projects.length,
      conversationsCount,
      openConversationsCount,
      unreadConversationsCount,
      ticketsCount,
      openTicketsCount,
      agentsCount,
      activeChannelsCount
    };
  }

  async createProject(userId: string, data: { name: string; key?: string }) {
    await this.assertGlobalAdmin(userId);
    const secret = this.crypto.randomToken();
    const cleanPrefix = data.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "").slice(0, 8);
    const uniqueSuffix = this.crypto.randomToken(8).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
    const key = data.key?.trim() ? data.key.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-") : `${cleanPrefix ? cleanPrefix + "-" : ""}${uniqueSuffix}`;

    const project = await this.db.project.create({
      data: {
        name: data.name,
        key,
        integrationKey: key,
        integrationSecret: secret,
        members: { create: { userId, role: "ADMIN" } },
        botConfiguration: { create: { botName: `${data.name} Bot` } },
        widgetChannel: {
          create: {
            channelId: makeChannelId(key),
            name: `${data.name} Website`
          }
        }
      } as Prisma.ProjectCreateInput,
      select: {
        id: true,
        name: true,
        key: true,
        integrationKey: true,
        widgetChannel: { select: { id: true, channelId: true, name: true, enabled: true, welcomeMessage: true } }
      }
    });
    return { ...project, integrationSecret: secret };
  }

  async deleteProject(userId: string, projectId: string) {
    await this.assertGlobalAdmin(userId);
    await this.db.project.delete({
      where: { id: projectId }
    });
    return { ok: true, deletedId: projectId };
  }

  async deleteContact(userId: string, projectId: string, contactId: string) {
    await this.assertMember(userId, projectId);
    await this.db.contact.delete({
      where: { id: contactId, projectId }
    });
    return { ok: true, deletedId: contactId };
  }

  async channels(userId: string, projectId: string) {
    await this.assertMember(userId, projectId);
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        key: true,
        name: true
      }
    });
    if (!project) throw new NotFoundException();

    const channelSelect = {
      id: true,
      channelId: true,
      name: true,
      enabled: true,
      websiteUrl: true,
      welcomeMessage: true,
      colorTheme: true,
      logoUrl: true,
      collectVisitorInfo: true,
      visitorNameEnabled: true,
      visitorEmailEnabled: true,
      visitorPhoneEnabled: true,
      launcherPosition: true,
      createdAt: true
    } satisfies Prisma.WidgetChannelSelect;

    const widgetChannel =
      (await this.db.widgetChannel.findUnique({
        where: { projectId },
        select: channelSelect
      })) ??
      (await this.db.widgetChannel.create({
        data: { projectId, channelId: makeChannelId(project.key), name: `${project.name} Website` },
        select: channelSelect
      }));

    const visitorSettings = this.widgetVisitorSettings(widgetChannel);
    return [{ type: "WEBSITE_WIDGET", projectId: project.id, projectKey: project.key, ...widgetChannel, ...visitorSettings }];
  }

  async integrationCredentials(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      select: { integrationKey: true, integrationSecret: true, integrationRevokedAt: true } as Prisma.ProjectSelect
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async rotateIntegrationSecret(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);

    const secret = this.crypto.randomToken();
    const project = await this.db.project.update({
      where: { id: projectId },
      data: {
        integrationSecret: secret,
        integrationRevokedAt: null
      } as Prisma.ProjectUpdateInput,
      select: { integrationKey: true, integrationSecret: true, integrationRevokedAt: true } as Prisma.ProjectSelect
    });

    return project;
  }

  async updateWidget(
    userId: string,
    projectId: string,
    data: {
      welcomeMessage?: string;
      colorTheme?: string;
      logoUrl?: string;
      collectVisitorInfo?: boolean;
      visitorNameEnabled?: boolean;
      visitorEmailEnabled?: boolean;
      visitorPhoneEnabled?: boolean;
    }
  ) {
    await this.assertProjectAdmin(userId, projectId);
    const project = await this.db.project.findUnique({ where: { id: projectId }, select: { key: true, name: true } });
    if (!project) throw new NotFoundException("Project not found");
    const existingChannel = await this.db.widgetChannel.findUnique({
      where: { projectId },
      select: { id: true }
    });
    const updatedChannel = existingChannel
      ? await this.db.widgetChannel.update({
          where: { id: existingChannel.id },
          data: {
            welcomeMessage: data.welcomeMessage,
            colorTheme: data.colorTheme,
            logoUrl: data.logoUrl,
            collectVisitorInfo: data.collectVisitorInfo,
            visitorNameEnabled: data.visitorNameEnabled,
            visitorEmailEnabled: data.visitorEmailEnabled,
            visitorPhoneEnabled: data.visitorPhoneEnabled
          },
          select: widgetChannelPublicSelect
        })
      : await this.db.widgetChannel.create({
          data: {
            projectId,
            channelId: makeChannelId(project.key),
            name: `${project.name} Website`,
            welcomeMessage: data.welcomeMessage,
            colorTheme: data.colorTheme,
            logoUrl: data.logoUrl,
            collectVisitorInfo: data.collectVisitorInfo,
            visitorNameEnabled: data.visitorNameEnabled,
            visitorEmailEnabled: data.visitorEmailEnabled,
            visitorPhoneEnabled: data.visitorPhoneEnabled
          },
          select: widgetChannelPublicSelect
        });
    return updatedChannel;
  }

  async agents(userId: string, projectId: string) {
    await this.assertMember(userId, projectId);
    return this.db.projectMember.findMany({
      where: { projectId },
      select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } }
    });
  }

  async lookupAgent(userId: string, projectId: string, email: string) {
    await this.assertProjectAdmin(userId, projectId);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return { exists: false };
    const user = await this.db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true }
    });
    return user ? { exists: true, user } : { exists: false };
  }

  async createAgent(userId: string, projectId: string, data: { email: string; name: string; password?: string; role?: Role }) {
    await this.assertProjectAdmin(userId, projectId);
    const currentUser = await this.db.user.findUnique({ where: { id: userId }, select: { role: true } });
    const normalizedEmail = data.email.trim().toLowerCase();
    const requestedRole = data.role === "PROJECT_ADMIN" ? "PROJECT_ADMIN" : "PROJECT_AGENT";
    if (currentUser?.role !== "ADMIN" && requestedRole === "PROJECT_ADMIN") {
      throw new ForbiddenException("Only admin can add project admins");
    }
    const existingUser = await this.db.user.findUnique({ where: { email: normalizedEmail } });
    if (!existingUser && !data.password) throw new BadRequestException("Password is required for a new user");

    const user = existingUser
      ? await this.db.user.update({
          where: { id: existingUser.id },
          data: { name: data.name || existingUser.name }
        })
      : await this.db.user.create({
          data: {
            email: normalizedEmail,
            name: data.name,
            role: "PROJECT_AGENT",
            passwordHash: await this.crypto.hashSecret(data.password!)
          }
        });
    return this.db.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      update: { role: requestedRole },
      create: { projectId, userId: user.id, role: requestedRole },
      select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } }
    });
  }

  async updateAgentPassword(userId: string, projectId: string, memberId: string, password: string) {
    await this.assertProjectAdmin(userId, projectId);
    const currentUser = await this.db.user.findUnique({ where: { id: userId }, select: { role: true } });
    const member = await this.db.projectMember.findUnique({
      where: { id: memberId },
      select: { projectId: true, role: true, userId: true }
    });
    if (!member || member.projectId !== projectId) throw new NotFoundException("Project user not found");
    if (currentUser?.role !== "ADMIN" && member.role === "PROJECT_ADMIN") {
      throw new ForbiddenException("Only admin can reset project admin passwords");
    }
    await this.db.user.update({
      where: { id: member.userId },
      data: { passwordHash: await this.crypto.hashSecret(password) }
    });
    return { ok: true };
  }

  async removeAgent(userId: string, projectId: string, memberId: string) {
    await this.assertProjectAdmin(userId, projectId);
    const currentUser = await this.db.user.findUnique({ where: { id: userId }, select: { role: true } });
    const member = await this.db.projectMember.findUnique({ where: { id: memberId }, select: { projectId: true, role: true } });
    if (!member || member.projectId !== projectId) throw new NotFoundException("Project user not found");
    if (currentUser?.role !== "ADMIN" && member.role === "PROJECT_ADMIN") {
      throw new ForbiddenException("Only admin can remove project admins");
    }
    await this.db.projectMember.delete({ where: { id: memberId } });
    return { ok: true };
  }

  async conversations(userId: string, projectId: string, cursor?: string, search?: string) {
    await this.assertMember(userId, projectId);
    return this.db.conversation.findMany({
      where: { projectId, contact: search ? { name: { contains: search, mode: "insensitive" } } : undefined },
      take: 31,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { lastMessageAt: "desc" },
      select: {
        id: true,
        projectId: true,
        contactId: true,
        status: true,
        automationMode: true,
        unreadCount: true,
        lastMessageAt: true,
        contact: { select: { name: true, phone: true, email: true, externalUserId: true } },
        messages: { take: 1, orderBy: { createdAt: "desc" }, select: { content: true } }
      }
    }).then((conversations) =>
      conversations.map((conversation) => ({
        id: conversation.id,
        projectId: conversation.projectId,
        contactId: conversation.contactId,
        contactName: conversation.contact?.name ?? "Customer",
        contactPhone: conversation.contact?.phone ?? null,
        contactEmail: conversation.contact?.email ?? null,
        externalUserId: conversation.contact?.externalUserId ?? null,
        status: conversation.status,
        automationMode: conversation.automationMode,
        unreadCount: conversation.unreadCount,
        lastMessageAt: conversation.lastMessageAt,
        preview: conversation.messages[0]?.content ?? ""
      }))
    );
  }

  async updateConversationStatus(userId: string, conversationId: string, status: ConversationStatus) {
    const c = await this.db.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException();
    await this.assertMember(userId, c.projectId);

    const updated = await this.db.conversation.update({
      where: { id: conversationId },
      data: {
        status,
        automationMode: status === ConversationStatus.RESOLVED ? AutomationMode.AUTOMATED : status === ConversationStatus.OPEN ? AutomationMode.HUMAN : undefined
      }
    });

    if (status === "RESOLVED") {
      await this.db.ticket.updateMany({
        where: {
          conversationId,
          status: { notIn: ["RESOLVED", "CLOSED"] }
        },
        data: { status: "RESOLVED" }
      });
    }
    
    // Optional: Emit a real-time event so the UI updates instantly
    this.realtime.emitProject(c.projectId, SupportEvent.ConversationAssigned, updated);

    return { ok: true };
  }

  async messages(userId: string, conversationId: string, cursor?: string) {
    const c = await this.db.conversation.findUnique({ where: { id: conversationId }, select: { projectId: true } });
    if (!c) throw new NotFoundException();
    await this.assertMember(userId, c.projectId);
    
    // Mark conversation messages as read when viewed by an agent
    await this.db.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 }
    }).catch(() => undefined);

    return this.db.message.findMany({
      where: { conversationId },
      take: 51,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" }
    });
  }

  async agentMessage(userId: string, conversationId: string, content: string) {
    const c = await this.db.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException();
    await this.assertMember(userId, c.projectId);
    const msg = await this.db.message.create({
      data: { conversationId, senderType: "AGENT", senderId: userId, content, status: "PENDING" }
    });
    await this.db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), unreadCount: 0, status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN }
    });
    this.realtime.emitProject(c.projectId, SupportEvent.MessageCreated, msg);
    this.realtime.emitConversation(conversationId, SupportEvent.MessageCreated, msg);
    await this.queues.queueWebhook(SupportEvent.MessageCreated, c.projectId, msg);
    return msg;
  }

  async createTicket(
    userId: string,
    conversationId: string,
    data: Pick<Prisma.TicketCreateInput, "title" | "priority">
  ) {
    const c = await this.db.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException();
    await this.assertMember(userId, c.projectId);

    const existingActiveTicket = await this.db.ticket.findFirst({
      where: {
        conversationId,
        status: { notIn: ["RESOLVED", "CLOSED"] }
      },
      orderBy: { createdAt: "desc" }
    });

    await this.db.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN, lastMessageAt: new Date() }
    });

    if (existingActiveTicket) {
      return existingActiveTicket;
    }

    const ticket = await this.db.ticket.create({
      data: {
        projectId: c.projectId,
        conversationId,
        contactId: c.contactId,
        title: data.title,
        priority: data.priority
      }
    });
    this.realtime.emitProject(c.projectId, SupportEvent.TicketCreated, ticket);
    await this.queueTicketEmail(c.projectId, "created", ticket);
    return ticket;
  }

  async updateTicketStatus(userId: string, ticketId: string, status: TicketStatus) {
    const current = await this.db.ticket.findUnique({ where: { id: ticketId } });
    if (!current) throw new NotFoundException("Ticket not found");
    await this.assertMember(userId, current.projectId);

    const ticket = await this.db.ticket.update({
      where: { id: ticketId },
      data: { status }
    });

    if (status === "RESOLVED" || status === "CLOSED") {
      await this.db.ticket.updateMany({
        where: {
          conversationId: ticket.conversationId,
          id: { not: ticket.id },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
        },
        data: { status }
      });

      const activeTicketCount = await this.db.ticket.count({
        where: {
          conversationId: ticket.conversationId,
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
        }
      });

      if (activeTicketCount === 0) {
        await this.db.conversation.update({
          where: { id: ticket.conversationId },
          data: { status: ConversationStatus.RESOLVED, automationMode: AutomationMode.AUTOMATED }
        });
      }
    } else {
      await this.db.conversation.update({
        where: { id: ticket.conversationId },
        data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN }
      });
    }

    if (current.status !== ticket.status) {
      await this.queueTicketEmail(ticket.projectId, "status", ticket, current.status);
    }

    return ticket;
  }

  async tickets(userId: string, projectId?: string) {
    const scopedProject = projectId ?? (await this.projects(userId))[0]?.id;
    if (!scopedProject) return [];
    await this.assertMember(userId, scopedProject);
    return this.db.ticket.findMany({
      where: { projectId: scopedProject },
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectId: true,
        conversationId: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        conversation: {
          select: {
            contact: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      }
    }).then((tickets) =>
      tickets.map((ticket) => ({
        id: ticket.id,
        projectId: ticket.projectId,
        conversationId: ticket.conversationId,
        title: ticket.title,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        customerName: ticket.conversation.contact.name ?? "Customer",
        customerPhone: ticket.conversation.contact.phone ?? null
      }))
    );
  }

  async webhooks(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);
    return this.db.webhook.findMany({
      where: { projectId },
      select: { id: true, name: true, url: true, isActive: true, enabled: true, events: true, timeoutMs: true, retryCount: true, secret: true }
    });
  }

  async createWebhook(userId: string, projectId: string, data: { name: string, url: string, isActive?: boolean }) {
    await this.assertProjectAdmin(userId, projectId);
    
    if (data.isActive) {
      await this.db.webhook.updateMany({
        where: { projectId },
        data: { isActive: false }
      });
    }

    const signingSecret = this.crypto.randomToken();
    const webhook = await this.db.webhook.create({
      data: {
        projectId,
        name: data.name || "New Bot",
        url: data.url,
        isActive: data.isActive || false,
        secretHash: await this.crypto.hashSecret(signingSecret),
        secret: signingSecret,
        enabled: true,
        events: [SupportEvent.MessageCreated, SupportEvent.TicketCreated, SupportEvent.ConversationAssigned]
      },
      select: { id: true, name: true, url: true, isActive: true, enabled: true, events: true, secret: true }
    });
    return { ...webhook, signingSecret };
  }

  async updateWebhook(userId: string, projectId: string, webhookId: string, data: { name?: string, url?: string, isActive?: boolean }) {
    await this.assertProjectAdmin(userId, projectId);
    
    if (data.isActive) {
      await this.db.webhook.updateMany({
        where: { projectId, id: { not: webhookId } },
        data: { isActive: false }
      });
    }

    const webhook = await this.db.webhook.update({
      where: { id: webhookId, projectId },
      data: { 
        name: data.name,
        url: data.url,
        isActive: data.isActive
      },
      select: { id: true, name: true, url: true, isActive: true, enabled: true, events: true, secret: true }
    });
    return webhook;
  }

  async deleteWebhook(userId: string, projectId: string, webhookId: string) {
    await this.assertProjectAdmin(userId, projectId);
    await this.db.webhook.delete({
      where: { id: webhookId, projectId }
    });
    return { success: true };
  }

  async notificationSettings(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);
    const settings = await this.db.projectNotificationSettings.findUnique({
      where: { projectId },
      select: {
        notificationEmail: true,
        ticketCreatedEnabled: true,
        ticketAssignedEnabled: true,
        conversationAssignedEnabled: true,
        messageReceivedEnabled: true
      }
    });
    if (!settings) return null;
    return { ...settings, notificationEmails: parseEmailList(settings.notificationEmail) };
  }

  async updateNotificationSettings(
    userId: string,
    projectId: string,
    data: {
      notificationEmail: string;
      ticketCreatedEnabled?: boolean;
      ticketAssignedEnabled?: boolean;
      conversationAssignedEnabled?: boolean;
      messageReceivedEnabled?: boolean;
    }
  ) {
    await this.assertProjectAdmin(userId, projectId);
    const emails = parseEmailList(data.notificationEmail);
    if (!emails.length) throw new BadRequestException("Add at least one valid notification email.");

    const settings = await this.db.projectNotificationSettings.upsert({
      where: { projectId },
      update: {
        notificationEmail: emails.join(","),
        ticketCreatedEnabled: data.ticketCreatedEnabled,
        ticketAssignedEnabled: data.ticketAssignedEnabled,
        conversationAssignedEnabled: data.conversationAssignedEnabled,
        messageReceivedEnabled: data.messageReceivedEnabled
      },
      create: {
        projectId,
        notificationEmail: emails.join(","),
        ticketCreatedEnabled: data.ticketCreatedEnabled ?? true,
        ticketAssignedEnabled: data.ticketAssignedEnabled ?? true,
        conversationAssignedEnabled: data.conversationAssignedEnabled ?? true,
        messageReceivedEnabled: data.messageReceivedEnabled ?? false
      },
      select: {
        notificationEmail: true,
        ticketCreatedEnabled: true,
        ticketAssignedEnabled: true,
        conversationAssignedEnabled: true,
        messageReceivedEnabled: true
      }
    });
    return { ...settings, notificationEmails: emails };
  }
  async widgetConfig(channelId: string) {
    const channel = await this.db.widgetChannel.findUnique({
      where: { channelId },
      select: {
        ...widgetChannelPublicSelect,
        project: {
          select: {
            id: true,
            name: true,
            botConfiguration: {
              select: {
                botName: true,
                botAvatar: true,
                fallbackMessage: true
              }
            }
          }
        }
      }
    });
    if (!channel || !channel.enabled) throw new NotFoundException("Widget offline");
    const botConfig = channel.project.botConfiguration;
    const botAvatar = channel.logoUrl || botConfig?.botAvatar || null;
    const botName = botConfig?.botName || channel.name || channel.project.name || "Support Bot";
    const welcomeMessage = channel.welcomeMessage || botConfig?.fallbackMessage || "Hi, welcome in. Send us a message and our team will reply as soon as possible.";

    return {
      name: channel.name || channel.project.name,
      welcomeMessage,
      colorTheme: channel.colorTheme || "#0f4c42",
      logoUrl: botAvatar,
      launcherPosition: channel.launcherPosition,
      botName,
      botAvatar,
      collectVisitorInfo: channel.collectVisitorInfo,
      visitorNameEnabled: channel.visitorNameEnabled,
      visitorEmailEnabled: channel.visitorEmailEnabled,
      visitorPhoneEnabled: channel.visitorPhoneEnabled
    };
  }

  async widgetMessages(channelId: string, profileId: string) {
    if (!profileId) return [];
    const channel = await this.db.widgetChannel.findUnique({
      where: { channelId },
      select: { id: true, projectId: true }
    });
    if (!channel) throw new NotFoundException();
    
    const contact = await this.db.contact.findUnique({
      where: { projectId_externalUserId: { projectId: channel.projectId, externalUserId: profileId } }
    });
    if (!contact) return [];
    
    const conversation = await this.db.conversation.findFirst({
      where: { projectId: channel.projectId, contactId: contact.id },
      orderBy: { createdAt: 'desc' }
    });
    if (!conversation) return [];

    return this.db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async widgetSendMessage(channelId: string, profileId: string, content: string, name?: string, email?: string, number?: string) {
    const channel = await this.db.widgetChannel.findUnique({
      where: { channelId },
      select: { id: true, projectId: true, enabled: true, project: { select: { name: true } } }
    });
    if (!channel || !channel.enabled) throw new NotFoundException();

    const contactName = name?.trim() || randomVisitorName(profileId, channel.project.name);

    const contact = await this.db.contact.upsert({
      where: { projectId_externalUserId: { projectId: channel.projectId, externalUserId: profileId } },
      create: { projectId: channel.projectId, externalUserId: profileId, name: contactName, email: email?.trim() || undefined, phone: number?.trim() || undefined },
      update: { name: name?.trim() || undefined, email: email?.trim() || undefined, phone: number?.trim() || undefined }
    });

    let conversation = await this.db.conversation.findFirst({
      where: { projectId: channel.projectId, contactId: contact.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!conversation) {
      conversation = await this.db.conversation.create({
        data: { projectId: channel.projectId, contactId: contact.id, status: "PENDING" }
      });
    } else if (conversation.status === "RESOLVED") {
      conversation = await this.db.conversation.update({
        where: { id: conversation.id },
        data: { status: "PENDING", automationMode: "AUTOMATED" }
      });
    }

    const msg = await this.db.message.create({
      data: { conversationId: conversation.id, senderType: "CUSTOMER", content }
    });
    
    await this.db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 }
      }
    });
    
    // Emit to agents viewing the inbox
    this.realtime.emitProject(channel.projectId, SupportEvent.MessageCreated, msg);
    
    // Try emitting to widget (requires realtime gateway update)
    this.realtime.emitConversation(conversation.id, SupportEvent.MessageCreated, msg);

    await this.queues.queueWebhook(SupportEvent.MessageCreated, channel.projectId, msg);

    // If an external webhook is active, let the external bot handle handoff logic.
    // Otherwise, check for internal bot handoff keywords.
    const webhook = await this.db.webhook.findFirst({ where: { projectId: channel.projectId, isActive: true } });
    const botConfig = await this.db.botConfiguration.findUnique({ where: { projectId: channel.projectId } });
    
    const containsKeyword = Boolean(
      (!webhook || !webhook.enabled) &&
      botConfig?.enabled &&
      botConfig?.handoffKeywords.some((kw: string) => content.toLowerCase().includes(kw.toLowerCase()))
    );

    if (containsKeyword) {
      await this.db.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN }
      });
      const existingOpenTicket = await this.db.ticket.findFirst({
        where: {
          conversationId: conversation.id,
          status: { notIn: ["RESOLVED", "CLOSED"] }
        }
      });
      if (!existingOpenTicket) {
        const ticket = await this.db.ticket.create({
          data: {
            projectId: channel.projectId,
            conversationId: conversation.id,
            contactId: contact.id,
            title: `Handoff requested: ${content.slice(0, 80)}`,
            priority: "MEDIUM"
          }
        });
        this.realtime.emitProject(channel.projectId, SupportEvent.TicketCreated, ticket);
        await this.queueTicketEmail(channel.projectId, "created", ticket);
      }
    }

    if (botConfig && botConfig.enabled && botConfig.responseMode === "AUTOMATED" && botConfig.fallbackMessage && !containsKeyword) {
      const canBotReply = conversation.status === "PENDING" || conversation.status === "RESOLVED";
      if (canBotReply) {

        
        // Auto-reply only when no external webhook is active. If a webhook is enabled,
        // the external bot/support workflow owns the customer-facing reply.
        if (!webhook || !webhook.enabled) {
          setTimeout(async () => {
            try {
              const botMsg = await this.db.message.create({
                data: {
                  conversationId: conversation.id,
                  senderType: "BOT",
                  content: botConfig.fallbackMessage,
                  status: "SENT"
                }
              });
              await this.db.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
              });
              this.realtime.emitProject(channel.projectId, SupportEvent.MessageCreated, botMsg);
              this.realtime.emitConversation(conversation.id, SupportEvent.MessageCreated, botMsg);
            } catch {
              return undefined;
            }
          }, 600);
        }
      }
    }

    return msg;
  }

  async globalSearch(userId: string, query: string) {
    if (!query || query.trim().length === 0) {
      return { projects: [], tickets: [], contacts: [], conversations: [] };
    }
    const searchQuery = query.trim();

    const userProjects = await this.projects(userId);
    const projectIds = userProjects.map((project) => project.id);

    if (projectIds.length === 0) {
      return { projects: [], tickets: [], contacts: [], conversations: [] };
    }

    const [projects, tickets, contacts, conversations] = await Promise.all([
      this.db.project.findMany({
        where: {
          id: { in: projectIds },
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { key: { contains: searchQuery, mode: "insensitive" } }
          ]
        },
        take: 5,
        select: { id: true, name: true, key: true }
      }),

      this.db.ticket.findMany({
        where: {
          projectId: { in: projectIds },
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { id: { contains: searchQuery, mode: "insensitive" } }
          ]
        },
        take: 5,
        select: { id: true, title: true, status: true, projectId: true }
      }),

      this.db.contact.findMany({
        where: {
          projectId: { in: projectIds },
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
            { phone: { contains: searchQuery, mode: "insensitive" } }
          ]
        },
        take: 5,
        select: { id: true, name: true, email: true, phone: true, projectId: true }
      }),

      this.db.conversation.findMany({
        where: {
          projectId: { in: projectIds },
          messages: {
            some: {
              content: { contains: searchQuery, mode: "insensitive" }
            }
          }
        },
        take: 5,
        select: {
          id: true,
          projectId: true,
          contact: { select: { name: true } },
          messages: {
            where: { content: { contains: searchQuery, mode: "insensitive" } },
            take: 1,
            select: { content: true }
          }
        }
      })
    ]);

    return { projects, tickets, contacts, conversations };
  }

  private widgetVisitorSettings(channel: WidgetVisitorSettings): WidgetVisitorSettings {
    return {
      collectVisitorInfo: channel.collectVisitorInfo ?? defaultWidgetVisitorSettings.collectVisitorInfo,
      visitorNameEnabled: channel.visitorNameEnabled ?? defaultWidgetVisitorSettings.visitorNameEnabled,
      visitorEmailEnabled: channel.visitorEmailEnabled ?? defaultWidgetVisitorSettings.visitorEmailEnabled,
      visitorPhoneEnabled: channel.visitorPhoneEnabled ?? defaultWidgetVisitorSettings.visitorPhoneEnabled
    };
  }

  async queueTicketEmail(
    projectId: string,
    event: "created" | "status",
    ticket: { id: string; title: string; status: TicketStatus },
    oldStatus?: TicketStatus
  ) {
    const settings = await this.db.projectNotificationSettings.findUnique({ where: { projectId } });
    const enabled =
      event === "created" ? settings?.ticketCreatedEnabled !== false : settings?.ticketAssignedEnabled !== false;
    if (!enabled) return;

    const [globalAdmins, projectMembers] = await Promise.all([
      this.db.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true }
      }),
      this.db.projectMember.findMany({
        where: {
          projectId,
          role: { in: ["PROJECT_ADMIN", "PROJECT_AGENT"] }
        },
        select: { user: { select: { email: true } } }
      })
    ]);

    const recipients = Array.from(
      new Set([
        ...globalAdmins.map((admin) => admin.email),
        ...projectMembers.map((member) => member.user.email),
        ...parseEmailList(settings?.notificationEmail)
      ])
    )
      .filter((email) => email.toLowerCase() !== "admin@gmail.com")
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (!recipients.length) return;

    const ticketDetails = await this.db.ticket.findUnique({
      where: { id: ticket.id },
      select: {
        title: true,
        status: true,
        conversation: {
          select: {
            contact: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      }
    });
    const customerName = ticketDetails?.conversation?.contact?.name?.trim() || "Customer";
    const mobileNumber = ticketDetails?.conversation?.contact?.phone?.trim() || "Not provided";
    const subject =
      event === "created"
        ? `${customerName} raised a ticket`
        : `${customerName}'s ticket status changed`;
    const text =
      event === "created"
        ? `${customerName} raised a ticket.\n\nMobile number: ${mobileNumber}\nTicket: ${ticketDetails?.title ?? ticket.title}\nStatus: ${ticketDetails?.status ?? ticket.status}`
        : `${customerName}'s ticket status changed from ${oldStatus} to ${ticketDetails?.status ?? ticket.status}.\n\nMobile number: ${mobileNumber}\nTicket: ${ticketDetails?.title ?? ticket.title}`;

    await Promise.all(recipients.map((to) => this.queues.queueEmail(projectId, to, subject, text)));
  }

  async emailSettings(userId: string, projectId: string) {
    await this.assertMember(userId, projectId);
    const settings = await this.db.projectEmailSettings.findUnique({
      where: { projectId }
    });
    if (!settings) return null;
    const { smtpPassword, ...rest } = settings;
    return rest;
  }

  async updateEmailSettings(
    userId: string,
    projectId: string,
    data: {
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
      smtpUser: string;
      smtpPassword?: string;
      fromName?: string;
    }
  ) {
    const member = await this.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot update email settings");

    const existing = await this.db.projectEmailSettings.findUnique({ where: { projectId } });
    
    // If no password provided, use existing. If provided, update it.
    const smtpPassword = data.smtpPassword ? this.crypto.encryptSecret(data.smtpPassword) : existing?.smtpPassword;
    
    if (!smtpPassword) {
      throw new BadRequestException("SMTP password is required");
    }

    return this.db.projectEmailSettings.upsert({
      where: { projectId },
      create: {
        projectId,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpSecure: data.smtpSecure,
        smtpUser: data.smtpUser,
        smtpPassword,
        fromName: data.fromName
      },
      update: {
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpSecure: data.smtpSecure,
        smtpUser: data.smtpUser,
        smtpPassword,
        fromName: data.fromName
      }
    });
  }

  async testEmailSettings(userId: string, projectId: string) {
    const member = await this.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot test email settings");

    const settings = await this.db.projectEmailSettings.findUnique({ where: { projectId } });
    if (!settings) throw new BadRequestException("No email settings configured for this project");

    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const testRecipient = user.email.toLowerCase() === "admin@gmail.com"
      ? (process.env.BCC_EMAIL || user.email)
      : user.email;

    await this.queues.queueEmail(
      projectId,
      testRecipient,
      "Test Email from SupportHub",
      "If you are seeing this, your project's custom SMTP configuration is working correctly!"
    );

    return { success: true, message: `Test email queued successfully to ${testRecipient}` };
  }
}
