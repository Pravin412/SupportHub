import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma, TicketStatus, TicketPriority, ConversationStatus, Role, AutomationMode } from "@prisma/client";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { SupportEvent } from "../../common/events/support-events";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";
import { WhatsappService } from "../../common/whatsapp/whatsapp.service";
import { parsePhoneList } from "../../common/whatsapp/phone.utils";
import { buildSearchFilter, type SearchField } from "../../common/search/search-filters";

const ticketSearchFields: readonly SearchField<Prisma.TicketWhereInput>[] = [
  (match) => ({ id: match }),
  (match) => ({ title: match }),
  (match) => ({ conversation: { contact: { name: match } } }),
  (match) => ({ conversation: { contact: { phone: match } } })
];

const messageSearchFields: readonly SearchField<Prisma.MessageWhereInput>[] = [
  (match) => ({ content: match })
];

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
  private readonly logger = new Logger(CoreService.name);
  constructor(
    private prisma: PrismaService,
    private queues: QueueService,
    private realtime: RealtimeGateway,
    private crypto: CryptoService,
    private whatsapp: WhatsappService
  ) {}

  async assertMember(userId: string, projectId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === "ADMIN") return { id: "admin", projectId, userId, role: "ADMIN" as Role };
    const member = await this.prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
    if (!member) throw new ForbiddenException("Project access denied");
    return member;
  }

  async assertProjectAdmin(userId: string, projectId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === "ADMIN") return;
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true }
    });
    if (member?.role !== "PROJECT_ADMIN") throw new ForbiddenException("Project admin access required");
  }

  async assertGlobalAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") throw new ForbiddenException("Admin access required");
  }

  projects(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } }).then((user) =>
      this.prisma.project.findMany({
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
      this.prisma.conversation.count({ where: conversationWhere }),
      this.prisma.conversation.count({ where: { ...conversationWhere, status: { not: "RESOLVED" } } }),
      this.prisma.conversation.count({ where: { ...conversationWhere, unreadCount: { gt: 0 } } }),
      this.prisma.ticket.count({ where: ticketWhere }),
      this.prisma.ticket.count({ where: { ...ticketWhere, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      this.prisma.projectMember.count({ where: { projectId: { in: projectIds } } }),
      this.prisma.widgetChannel.count({ where: { projectId: { in: projectIds }, enabled: true } })
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

  async renameProject(userId: string, projectId: string, name: string) {
    await this.assertProjectAdmin(userId, projectId);
    const cleanName = name.trim();
    if (cleanName.length < 2) throw new BadRequestException("Project name must contain at least 2 characters");
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) throw new NotFoundException("Project not found");
    return this.prisma.project.update({
      where: { id: projectId },
      data: { name: cleanName },
      select: { id: true, name: true, key: true, widgetChannel: { select: { id: true, channelId: true, enabled: true } } }
    });
  }

  async createProject(userId: string, data: { name: string; key?: string }) {
    await this.assertGlobalAdmin(userId);
    const secret = this.crypto.randomToken();
    const cleanPrefix = data.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "").slice(0, 8);
    const uniqueSuffix = this.crypto.randomToken(8).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
    const key = data.key?.trim() ? data.key.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-") : `${cleanPrefix ? cleanPrefix + "-" : ""}${uniqueSuffix}`;

    const project = await this.prisma.project.create({
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
            colorTheme: "#2563EB",
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
    await this.prisma.project.delete({
      where: { id: projectId }
    });
    return { ok: true, deletedId: projectId };
  }

  async deleteContact(userId: string, projectId: string, contactId: string) {
    await this.assertMember(userId, projectId);
    await this.prisma.contact.delete({
      where: { id: contactId, projectId }
    });
    return { ok: true, deletedId: contactId };
  }

  async channels(userId: string, projectId: string) {
    await this.assertMember(userId, projectId);
    const project = await this.prisma.project.findUnique({
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
      (await this.prisma.widgetChannel.findUnique({
        where: { projectId },
        select: channelSelect
      })) ??
      (await this.prisma.widgetChannel.create({
        data: { projectId, channelId: makeChannelId(project.key), name: `${project.name} Website`, colorTheme: "#2563EB" },
        select: channelSelect
      }));

    const visitorSettings = this.widgetVisitorSettings(widgetChannel);
    return [{ type: "WEBSITE_WIDGET", projectId: project.id, projectKey: project.key, ...widgetChannel, ...visitorSettings }];
  }

  async integrationCredentials(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { integrationKey: true, integrationSecret: true, integrationRevokedAt: true } as Prisma.ProjectSelect
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async rotateIntegrationSecret(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);

    const secret = this.crypto.randomToken();
    const project = await this.prisma.project.update({
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
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { key: true, name: true } });
    if (!project) throw new NotFoundException("Project not found");
    const existingChannel = await this.prisma.widgetChannel.findUnique({
      where: { projectId },
      select: { id: true }
    });
    const updatedChannel = existingChannel
      ? await this.prisma.widgetChannel.update({
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
      : await this.prisma.widgetChannel.create({
          data: {
            projectId,
            channelId: makeChannelId(project.key),
            name: `${project.name} Website`,
            welcomeMessage: data.welcomeMessage,
            colorTheme: data.colorTheme ?? "#2563EB",
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
    return this.prisma.projectMember.findMany({
      where: { projectId },
      select: { id: true, role: true, emailNotificationsEnabled: true, mobileNumber: true, whatsappNotificationsEnabled: true, user: { select: { id: true, name: true, email: true } } }
    });
  }

  async lookupAgent(userId: string, projectId: string, email: string) {
    await this.assertProjectAdmin(userId, projectId);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return { exists: false };
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true }
    });
    return user ? { exists: true, user } : { exists: false };
  }

  private agentContact(data: { mobileNumber?: string; whatsappNotificationsEnabled?: boolean }) {
    const raw = data.mobileNumber?.trim() || "";
    const mobileNumber = raw.replace(/[\s()+-]/g, "");
    if (raw && !/^[1-9]\d{8,14}$/.test(mobileNumber)) throw new BadRequestException("Enter a valid mobile number including country code");
    if (data.whatsappNotificationsEnabled && !mobileNumber) throw new BadRequestException("A mobile number is required for WhatsApp notifications");
    return { mobileNumber: mobileNumber || null, whatsappNotificationsEnabled: !!mobileNumber && data.whatsappNotificationsEnabled === true };
  }

  async createAgent(userId: string, projectId: string, data: { email: string; name: string; password?: string; role?: Role; emailNotificationsEnabled?: boolean; mobileNumber?: string; whatsappNotificationsEnabled?: boolean }) {
    await this.assertProjectAdmin(userId, projectId);
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const normalizedEmail = data.email.trim().toLowerCase();
    const requestedRole = data.role === "PROJECT_ADMIN" ? "PROJECT_ADMIN" : "PROJECT_AGENT";
    if (currentUser?.role !== "ADMIN" && requestedRole === "PROJECT_ADMIN") {
      throw new ForbiddenException("Only admin can add project admins");
    }
    const contact = this.agentContact(data);
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!existingUser && !data.password) throw new BadRequestException("Password is required for a new user");

    const user = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { name: data.name || existingUser.name }
        })
      : await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            name: data.name,
            role: "PROJECT_AGENT",
            passwordHash: await this.crypto.hashSecret(data.password!)
          }
        });
    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      update: { role: requestedRole, emailNotificationsEnabled: data.emailNotificationsEnabled ?? false, ...contact },
      create: { projectId, userId: user.id, role: requestedRole, emailNotificationsEnabled: data.emailNotificationsEnabled ?? false, ...contact },
      select: { id: true, role: true, emailNotificationsEnabled: true, mobileNumber: true, whatsappNotificationsEnabled: true, user: { select: { id: true, name: true, email: true } } }
    });
  }

  async updateAgentPassword(userId: string, projectId: string, memberId: string, password: string) {
    await this.assertProjectAdmin(userId, projectId);
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      select: { projectId: true, role: true, userId: true }
    });
    if (!member || member.projectId !== projectId) throw new NotFoundException("Project user not found");
    if (currentUser?.role !== "ADMIN" && member.role === "PROJECT_ADMIN") {
      throw new ForbiddenException("Only admin can reset project admin passwords");
    }
    await this.prisma.user.update({
      where: { id: member.userId },
      data: { passwordHash: await this.crypto.hashSecret(password) }
    });
    return { ok: true };
  }

  async updateAgent(userId: string, projectId: string, memberId: string, data: { email: string; name: string; role: Role; emailNotificationsEnabled: boolean; mobileNumber?: string; whatsappNotificationsEnabled?: boolean }) {
    await this.assertProjectAdmin(userId, projectId);
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      select: { projectId: true, role: true, userId: true }
    });
    if (!member || member.projectId !== projectId) throw new NotFoundException("Project user not found");
    if (member.role === "ADMIN") throw new ForbiddenException("Admin access cannot be edited here");
    if (currentUser?.role !== "ADMIN" && member.role === "PROJECT_ADMIN") {
      throw new ForbiddenException("Only admin can edit project admins");
    }

    const requestedRole = data.role === "PROJECT_ADMIN" ? "PROJECT_ADMIN" : "PROJECT_AGENT";
    if (currentUser?.role !== "ADMIN" && requestedRole === "PROJECT_ADMIN") {
      throw new ForbiddenException("Only admin can make project admins");
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existingUser && existingUser.id !== member.userId) {
      throw new BadRequestException("Email is already used by another user");
    }

    const contact = this.agentContact(data);
    await this.prisma.user.update({
      where: { id: member.userId },
      data: { name: data.name.trim(), email: normalizedEmail }
    });

    return this.prisma.projectMember.update({
      where: { id: memberId },
      data: { role: requestedRole, emailNotificationsEnabled: data.emailNotificationsEnabled, ...contact },
      select: { id: true, role: true, emailNotificationsEnabled: true, mobileNumber: true, whatsappNotificationsEnabled: true, user: { select: { id: true, name: true, email: true } } }
    });
  }

  async removeAgent(userId: string, projectId: string, memberId: string) {
    await this.assertProjectAdmin(userId, projectId);
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const member = await this.prisma.projectMember.findUnique({ where: { id: memberId }, select: { projectId: true, role: true } });
    if (!member || member.projectId !== projectId) throw new NotFoundException("Project user not found");
    if (currentUser?.role !== "ADMIN" && member.role === "PROJECT_ADMIN") {
      throw new ForbiddenException("Only admin can remove project admins");
    }
    await this.prisma.projectMember.delete({ where: { id: memberId } });
    return { ok: true };
  }

  async conversations(userId: string, projectId: string, cursor?: string, search?: string) {
    await this.assertMember(userId, projectId);
    return this.prisma.conversation.findMany({
      where: {
        projectId,
        ...buildSearchFilter<Prisma.ConversationWhereInput>(search, [
          (match) => ({ contact: { name: match } })
        ])
      },
      take: 31,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { lastMessageAt: "desc" },
      distinct: ["contactId"],
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
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException();
    await this.assertMember(userId, c.projectId);

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status,
        automationMode: status === ConversationStatus.RESOLVED ? AutomationMode.AUTOMATED : status === ConversationStatus.OPEN ? AutomationMode.HUMAN : undefined
      }
    });

    if (status === "RESOLVED") {
      await this.prisma.ticket.updateMany({
        where: {
          conversationId,
          status: { notIn: ["RESOLVED", "CLOSED"] }
        },
        data: { status: "RESOLVED" }
      });
    }
    
    // Optional: Emit a real-time event so the UI updates instantly
    this.realtime.emitProject(c.projectId, SupportEvent.ConversationAssigned, updated);
    this.realtime.emitConversation(conversationId, SupportEvent.ConversationAssigned, updated);

    return { ok: true };
  }

  async messages(userId: string, conversationId: string, cursor?: string) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId }, select: { projectId: true, contactId: true } });
    if (!c) throw new NotFoundException();
    await this.assertMember(userId, c.projectId);
    
    // Mark conversation messages as read when viewed by an agent
    const read = await this.prisma.conversation.updateMany({
      where: { projectId: c.projectId, contactId: c.contactId, unreadCount: { gt: 0 } },
      data: { unreadCount: 0 }
    });
    if (read.count) {
      this.realtime.emitProject(c.projectId, SupportEvent.ConversationAssigned, { id: conversationId });
    }

    const messages = await this.prisma.message.findMany({
      where: { conversation: { projectId: c.projectId, contactId: c.contactId } },
      take: 51,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: { conversation: true }
    });
    const sessions = new Map(messages.map((message) => [message.conversationId, message.conversation]));
    await this.confirmDelivery(c.projectId, messages.filter((message) => message.senderType === "CUSTOMER" && message.status !== "DELIVERED" && message.status !== "FAILED"));
    const history: Array<{ id: string; conversationId: string; content: string; senderType: string; status: string; createdAt: Date }> = messages.map(({ conversation, ...message }) => message);
    for (const session of sessions.values()) {
      history.push({ id: `session-start-${session.id}`, conversationId: session.id, content: "New conversation started", senderType: "SYSTEM", status: "SENT", createdAt: session.createdAt });
      if (session.status === ConversationStatus.RESOLVED) {
        history.push({ id: `session-end-${session.id}`, conversationId: session.id, content: "Conversation ended", senderType: "SYSTEM", status: "SENT", createdAt: session.lastMessageAt });
      }
    }
    const markerOrder = (id: string) => id.startsWith("session-end-") ? 2 : id.startsWith("session-start-") ? 0 : 1;
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || markerOrder(b.id) - markerOrder(a.id));
  }

  async agentMessage(userId: string, conversationId: string, content: string) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException();
    await this.assertMember(userId, c.projectId);
    const msg = await this.prisma.message.create({
      data: { conversationId, senderType: "AGENT", senderId: userId, content, status: "SENT" }
    });
    this.logger.log(`[agent] saved project=${c.projectId} conversation=${conversationId} message=${msg.id} characters=${content.length}`);
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), unreadCount: 0, status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN }
    });
    this.realtime.emitProject(c.projectId, SupportEvent.MessageCreated, msg);
    this.realtime.emitConversation(conversationId, SupportEvent.MessageCreated, msg);
    await this.queues.queueWebhook(SupportEvent.MessageCreated, c.projectId, msg);
    this.logger.log(`[agent] webhook queued project=${c.projectId} conversation=${conversationId} message=${msg.id}`);
    return msg;
  }

  async createTicket(
    userId: string,
    conversationId: string,
    data: Pick<Prisma.TicketCreateInput, "title" | "priority">
  ) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException();
    await this.assertMember(userId, c.projectId);

    const existingActiveTicket = await this.prisma.ticket.findFirst({
      where: {
        conversationId,
        status: { notIn: ["RESOLVED", "CLOSED"] }
      },
      orderBy: { createdAt: "desc" }
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN, lastMessageAt: new Date() }
    });

    if (existingActiveTicket) {
      return existingActiveTicket;
    }

    const ticket = await this.prisma.ticket.create({
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
    await this.queueTicketWhatsapp(c.projectId, "created", ticket);
    return ticket;
  }

  async updateTicketStatus(userId: string, ticketId: string, status: TicketStatus) {
    const current = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!current) throw new NotFoundException("Ticket not found");
    await this.assertMember(userId, current.projectId);

    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    });

    if (status === "RESOLVED" || status === "CLOSED") {
      await this.prisma.ticket.updateMany({
        where: {
          conversationId: ticket.conversationId,
          id: { not: ticket.id },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
        },
        data: { status }
      });

      const activeTicketCount = await this.prisma.ticket.count({
        where: {
          conversationId: ticket.conversationId,
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }
        }
      });

      if (activeTicketCount === 0) {
        const resolvedConversation = await this.prisma.conversation.update({
          where: { id: ticket.conversationId },
          data: { status: ConversationStatus.RESOLVED, automationMode: AutomationMode.AUTOMATED }
        });
        this.realtime.emitConversation(ticket.conversationId, SupportEvent.ConversationAssigned, resolvedConversation);
      }
    } else {
      await this.prisma.conversation.update({
        where: { id: ticket.conversationId },
        data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN }
      });
    }

    if (current.status !== ticket.status) {
      await this.queueTicketEmail(ticket.projectId, "status", ticket, current.status);
    }

    return ticket;
  }

  async tickets(userId: string, projectId?: string, search?: string) {
    const scopedProject = projectId ?? (await this.projects(userId))[0]?.id;
    if (!scopedProject) return [];
    await this.assertMember(userId, scopedProject);
    return this.prisma.ticket.findMany({
      where: {
        projectId: scopedProject,
        ...buildSearchFilter(search, ticketSearchFields)
      },
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
    return this.prisma.webhook.findMany({
      where: { projectId },
      select: { id: true, name: true, url: true, isActive: true, enabled: true, events: true, timeoutMs: true, retryCount: true, secret: true }
    });
  }

  async createWebhook(userId: string, projectId: string, data: { name: string, url: string, isActive?: boolean }) {
    await this.assertProjectAdmin(userId, projectId);
    
    if (data.isActive) {
      await this.prisma.webhook.updateMany({
        where: { projectId },
        data: { isActive: false }
      });
    }

    const signingSecret = this.crypto.randomToken();
    const webhook = await this.prisma.webhook.create({
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
      await this.prisma.webhook.updateMany({
        where: { projectId, id: { not: webhookId } },
        data: { isActive: false }
      });
    }

    const webhook = await this.prisma.webhook.update({
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
    await this.prisma.webhook.delete({
      where: { id: webhookId, projectId }
    });
    return { success: true };
  }

  async notificationSettings(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);
    const settings = await this.prisma.projectNotificationSettings.findUnique({
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

    if (data.ticketCreatedEnabled || data.ticketAssignedEnabled) {
      const smtp = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
      if (!smtp || !smtp.enabled || !smtp.smtpHost || !smtp.smtpUser || !smtp.smtpPassword) {
        throw new BadRequestException("You should first configure Email SMTP Settings. Once you fill this, then only you can enable ticket emails.");
      }
    }

    const settings = await this.prisma.projectNotificationSettings.upsert({
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
        ticketCreatedEnabled: data.ticketCreatedEnabled ?? false,
        ticketAssignedEnabled: data.ticketAssignedEnabled ?? false,
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
    const channel = await this.prisma.widgetChannel.findUnique({
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
    const botAvatar = botConfig?.botAvatar || null;
    const botName = botConfig?.botName || channel.name || channel.project.name || "Support Bot";
    const welcomeMessage = channel.welcomeMessage || botConfig?.fallbackMessage || "Hi, welcome in. Send us a message and our team will reply as soon as possible.";

    return {
      name: channel.name || channel.project.name,
      welcomeMessage,
      colorTheme: channel.colorTheme || "#2563EB",
      logoUrl: channel.logoUrl || null,
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
    const channel = await this.prisma.widgetChannel.findUnique({
      where: { channelId },
      select: { id: true, projectId: true }
    });
    if (!channel) throw new NotFoundException();
    
    const contact = await this.prisma.contact.findUnique({
      where: { projectId_externalUserId: { projectId: channel.projectId, externalUserId: profileId } }
    });
    if (!contact) return [];
    
    const conversation = await this.prisma.conversation.findFirst({
      where: { projectId: channel.projectId, contactId: contact.id },
      orderBy: { createdAt: 'desc' }
    });
    if (!conversation || conversation.status === ConversationStatus.RESOLVED) return [];

    return this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async widgetDelivered(channelId: string, profileId: string, messageIds: string[]) {
    const channel = await this.prisma.widgetChannel.findUnique({ where: { channelId }, select: { projectId: true, enabled: true } });
    if (!channel?.enabled) throw new NotFoundException();
    const messages = await this.prisma.message.findMany({
      where: {
        id: { in: messageIds },
        senderType: { in: ["AGENT", "BOT"] },
        status: { in: ["PENDING", "SENT"] },
        conversation: { projectId: channel.projectId, contact: { externalUserId: profileId } }
      }
    });
    await this.confirmDelivery(channel.projectId, messages);
    return { ok: true };
  }

  private async confirmDelivery(projectId: string, messages: Array<{ id: string; conversationId: string; status: string }>) {
    if (!messages.length) return;
    await this.prisma.message.updateMany({
      where: { id: { in: messages.map((message) => message.id) }, status: { in: ["PENDING", "SENT"] } },
      data: { status: "DELIVERED" }
    });
    for (const message of messages) {
      message.status = "DELIVERED";
      const payload = { id: message.id, conversationId: message.conversationId, status: "DELIVERED" };
      this.realtime.emitProject(projectId, SupportEvent.MessageDelivered, payload);
      this.realtime.emitConversation(message.conversationId, SupportEvent.MessageDelivered, payload);
    }
  }

  async widgetSendMessage(channelId: string, profileId: string, content: string, name?: string, email?: string, number?: string) {
    this.logger.log(`[widget] received channel=${channelId} characters=${content.length}`);
    const channel = await this.prisma.widgetChannel.findUnique({
      where: { channelId },
      select: { id: true, projectId: true, enabled: true, project: { select: { name: true } } }
    });
    if (!channel || !channel.enabled) throw new NotFoundException();

    const contactName = name?.trim() || randomVisitorName(profileId, channel.project.name);

    const contact = await this.prisma.contact.upsert({
      where: { projectId_externalUserId: { projectId: channel.projectId, externalUserId: profileId } },
      create: { projectId: channel.projectId, externalUserId: profileId, name: contactName, email: email?.trim() || undefined, phone: number?.trim() || undefined },
      update: { name: name?.trim() || undefined, email: email?.trim() || undefined, phone: number?.trim() || undefined }
    });

    let conversation = await this.prisma.conversation.findFirst({
      where: { projectId: channel.projectId, contactId: contact.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!conversation || conversation.status === ConversationStatus.RESOLVED) {
      conversation = await this.prisma.conversation.create({
        data: { projectId: channel.projectId, contactId: contact.id, status: "PENDING" }
      });
    }

    const msg = await this.prisma.message.create({
      data: { conversationId: conversation.id, senderType: "CUSTOMER", content }
    });
    this.logger.log(`[widget] saved project=${channel.projectId} conversation=${conversation.id} message=${msg.id}`);
    
    await this.prisma.conversation.update({
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
    this.logger.log(`[widget] webhook queued project=${channel.projectId} conversation=${conversation.id} message=${msg.id}`);

    // If an external webhook is active, let the external bot handle handoff logic.
    // Otherwise, check for internal bot handoff keywords.
    const webhook = await this.prisma.webhook.findFirst({ where: { projectId: channel.projectId, isActive: true } });
    const botConfig = await this.prisma.botConfiguration.findUnique({ where: { projectId: channel.projectId } });
    
    const containsKeyword = Boolean(
      (!webhook || !webhook.enabled) &&
      botConfig?.enabled &&
      botConfig?.handoffKeywords.some((kw: string) => content.toLowerCase().includes(kw.toLowerCase()))
    );

    const hasExternalBot = Boolean(webhook?.enabled);
    const hasInternalBot = Boolean(botConfig?.enabled && botConfig.responseMode !== "HUMAN");
    const needsHumanSupport = !hasExternalBot && !hasInternalBot;

    if (containsKeyword || needsHumanSupport) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN }
      });
      const existingOpenTicket = await this.prisma.ticket.findFirst({
        where: {
          conversationId: conversation.id,
          status: { notIn: ["RESOLVED", "CLOSED"] }
        }
      });
      if (needsHumanSupport || !existingOpenTicket) {
        const ticket = await this.prisma.ticket.create({
          data: {
            projectId: channel.projectId,
            conversationId: conversation.id,
            contactId: contact.id,
            title: `${needsHumanSupport ? "Support requested" : "Handoff requested"}: ${content.slice(0, 80)}`,
            priority: "MEDIUM"
          }
        });
        this.realtime.emitProject(channel.projectId, SupportEvent.TicketCreated, ticket);
        await this.queueTicketEmail(channel.projectId, "created", ticket);
        await this.queueTicketWhatsapp(channel.projectId, "created", ticket);
      }
    }

    if (botConfig && botConfig.enabled && botConfig.responseMode === "AUTOMATED" && botConfig.fallbackMessage && !containsKeyword && !needsHumanSupport) {
      const canBotReply = conversation.status === "PENDING" || conversation.status === "RESOLVED";
      if (canBotReply) {

        
        // Auto-reply only when no external webhook is active. If a webhook is enabled,
        // the external bot/support workflow owns the customer-facing reply.
        if (!webhook || !webhook.enabled) {
          setTimeout(async () => {
            try {
              const botMsg = await this.prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  senderType: "BOT",
                  content: botConfig.fallbackMessage,
                  status: "SENT"
                }
              });
              await this.prisma.conversation.update({
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
      this.prisma.project.findMany({
        where: {
          id: { in: projectIds },
          ...buildSearchFilter<Prisma.ProjectWhereInput>(searchQuery, [
            (match) => ({ name: match }),
            (match) => ({ key: match })
          ])
        },
        take: 5,
        select: { id: true, name: true, key: true }
      }),

      this.prisma.ticket.findMany({
        where: {
          projectId: { in: projectIds },
          ...buildSearchFilter(searchQuery, ticketSearchFields)
        },
        take: 5,
        select: { id: true, title: true, status: true, projectId: true }
      }),

      this.prisma.contact.findMany({
        where: {
          projectId: { in: projectIds },
          ...buildSearchFilter<Prisma.ContactWhereInput>(searchQuery, [
            (match) => ({ name: match }),
            (match) => ({ email: match }),
            (match) => ({ phone: match })
          ])
        },
        take: 5,
        select: { id: true, name: true, email: true, phone: true, projectId: true }
      }),

      this.prisma.conversation.findMany({
        where: {
          projectId: { in: projectIds },
          messages: {
            some: buildSearchFilter(searchQuery, messageSearchFields)
          }
        },
        take: 5,
        select: {
          id: true,
          projectId: true,
          contact: { select: { name: true } },
          messages: {
            where: buildSearchFilter(searchQuery, messageSearchFields),
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
    const settings = await this.prisma.projectNotificationSettings.findUnique({ where: { projectId } });
    const enabled =
      event === "created" ? settings?.ticketCreatedEnabled === true : settings?.ticketAssignedEnabled === true;
    if (!enabled) return;
    const smtpSettings = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
    if (!smtpSettings || !smtpSettings.enabled || !smtpSettings.smtpHost || !smtpSettings.smtpUser || !smtpSettings.smtpPassword) {
      this.logger.debug(`[email] Skipping ticket email: Project ${projectId} has no custom SMTP configured.`);
      return;
    }

    const [globalAdmins, projectMembers] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true }
      }),
      this.prisma.projectMember.findMany({
        where: {
          projectId,
          role: { in: ["PROJECT_ADMIN", "PROJECT_AGENT"] }
        },
        select: { emailNotificationsEnabled: true, user: { select: { email: true } } }
      })
    ]);
    const disabledProjectMemberEmails = new Set(
      projectMembers
        .filter((member) => !member.emailNotificationsEnabled)
        .map((member) => member.user.email.toLowerCase())
    );

    const recipients = Array.from(
      new Set([
        ...globalAdmins.map((admin) => admin.email),
        ...projectMembers.filter((member) => member.emailNotificationsEnabled).map((member) => member.user.email),
        ...parseEmailList(settings?.notificationEmail)
      ])
    )
      .filter((email) => email.toLowerCase() !== "admin@gmail.com")
      .filter((email) => !disabledProjectMemberEmails.has(email.toLowerCase()))
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (!recipients.length) return;

    const ticketDetails = await this.prisma.ticket.findUnique({
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
    const settings = await this.prisma.projectEmailSettings.findUnique({
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

    const existing = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
    
    // If no password provided, use existing. If provided, update it.
    const smtpPassword = data.smtpPassword ? this.crypto.encryptSecret(data.smtpPassword) : existing?.smtpPassword;
    
    if (!smtpPassword) {
      throw new BadRequestException("SMTP password is required");
    }

    return this.prisma.projectEmailSettings.upsert({
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

    const settings = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
    if (!settings || !settings.enabled || !settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      throw new BadRequestException("No complete email SMTP settings configured for this project");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
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

  async queueTicketWhatsapp(
    projectId: string,
    event: "created" | "status",
    ticket: { id: string; title: string; status: TicketStatus; priority?: TicketPriority }
  ) {
    if (event === "created") {
      try {
        await this.whatsapp.sendTicketCreatedNotification(projectId, ticket);
      } catch (err) {
        this.logger.error(`[whatsapp] Error dispatching ticket notification for project ${projectId}`, err);
      }
    }
  }

  async whatsappSettings(userId: string, projectId: string) {
    const member = await this.assertMember(userId, projectId);
    const settings = await this.prisma.projectWhatsappSettings.findUnique({
      where: { projectId }
    });

    if (!settings) {
      return {
        id: null,
        projectId,
        enabled: false,
        ticketCreatedEnabled: false,
        recipientPhoneNumbers: [],
        ticketCreatedTemplateId: null,
        providerUrl: null,
        vendorId: null,
        accessToken: null,
        hasCustomToken: false,
        isConfigured: false
      };
    }

    const { accessToken, ...rest } = settings;
    return {
      ...rest,
      accessToken: accessToken && (member.role === "ADMIN" || member.role === "PROJECT_ADMIN")
        ? this.crypto.decryptSecret(accessToken)
        : null,
      hasCustomToken: Boolean(accessToken),
      isConfigured: Boolean(settings.enabled && settings.vendorId?.trim() && accessToken?.trim())
    };
  }

  async updateWhatsappSettings(
    userId: string,
    projectId: string,
    data: {
      enabled?: boolean;
      ticketCreatedEnabled?: boolean;
      recipientPhoneNumbers?: string[];
      ticketCreatedTemplateId?: string | null;
      providerUrl?: string | null;
      vendorId?: string | null;
      accessToken?: string | null;
    }
  ) {
    const member = await this.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot update WhatsApp settings");

    const existing = await this.prisma.projectWhatsappSettings.findUnique({ where: { projectId } });

    let encryptedToken = existing?.accessToken ?? null;
    if (data.accessToken && data.accessToken.trim()) {
      encryptedToken = this.crypto.encryptSecret(data.accessToken.trim());
    } else if (data.accessToken === "") {
      encryptedToken = null;
    }

    const willEnableGateway = data.enabled ?? existing?.enabled ?? false;
    if (data.ticketCreatedEnabled || willEnableGateway) {
      const willHaveVendor = data.vendorId !== undefined ? Boolean(data.vendorId?.trim()) : Boolean(existing?.vendorId?.trim());
      const willHaveToken = Boolean(encryptedToken);
      if (!willHaveVendor || !willHaveToken) {
        throw new BadRequestException("You should first configure WhatsApp Gateway Settings (Vendor ID and Access Token). Once you fill this, then only you can enable WhatsApp notifications.");
      }
    }

    return this.prisma.projectWhatsappSettings.upsert({
      where: { projectId },
      create: {
        projectId,
        enabled: data.enabled ?? data.ticketCreatedEnabled ?? false,
        ticketCreatedEnabled: data.ticketCreatedEnabled ?? false,
        recipientPhoneNumbers: parsePhoneList(data.recipientPhoneNumbers),
        ticketCreatedTemplateId: data.ticketCreatedTemplateId ?? null,
        providerUrl: data.providerUrl ?? null,
        vendorId: data.vendorId ?? null,
        accessToken: encryptedToken
      },
      update: {
        enabled: data.enabled ?? undefined,
        ticketCreatedEnabled: data.ticketCreatedEnabled ?? undefined,
        recipientPhoneNumbers: data.recipientPhoneNumbers !== undefined ? parsePhoneList(data.recipientPhoneNumbers) : undefined,
        ticketCreatedTemplateId: data.ticketCreatedTemplateId !== undefined ? data.ticketCreatedTemplateId : undefined,
        providerUrl: data.providerUrl !== undefined ? data.providerUrl : undefined,
        vendorId: data.vendorId !== undefined ? data.vendorId : undefined,
        accessToken: encryptedToken
      }
    });
  }

  async testWhatsappSettings(userId: string, projectId: string, targetPhone?: string) {
    const member = await this.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot test WhatsApp settings");

    const settings = await this.prisma.projectWhatsappSettings.findUnique({ where: { projectId } });
    if (!settings || !settings.enabled || !settings.vendorId?.trim() || !settings.accessToken?.trim()) {
      throw new BadRequestException("You should first configure WhatsApp Gateway Settings (Vendor ID and Access Token) for this project.");
    }

    const recipients = parsePhoneList(targetPhone || settings?.recipientPhoneNumbers);
    if (!recipients.length) {
      throw new BadRequestException("Please provide a recipient phone number with country code for testing");
    }

    const phone = recipients[0];
    let templateName = "ticket_alert";
    let language = "en_US";

    if (settings?.ticketCreatedTemplateId) {
      const tmpl = await this.prisma.projectWhatsappTemplate.findFirst({
        where: {
          projectId,
          OR: [{ id: settings.ticketCreatedTemplateId }, { name: settings.ticketCreatedTemplateId }]
        }
      });
      if (tmpl) {
        templateName = tmpl.name;
        language = tmpl.language;
      }
    }

    const result = await this.whatsapp.sendTemplateMessage({
      projectId,
      phoneNumber: phone,
      templateName,
      language,
      fields: ["Test Customer", "test@example.com", `${phone} (MEDIUM - OPEN)`, "SupportHub WhatsApp Verification | Ticket ID: TEST"]
    });
    if (!result.success) {
      throw new BadRequestException(result.message || "WhatsApp test message failed");
    }
    return result;
  }

  async whatsappTemplates(userId: string, projectId: string) {
    await this.assertMember(userId, projectId);
    return this.prisma.projectWhatsappTemplate.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" }
    });
  }

  async createWhatsappTemplate(
    userId: string,
    projectId: string,
    data: { name: string; displayName: string; language?: string; description?: string }
  ) {
    const member = await this.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot create templates");

    const cleanName = data.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!cleanName) throw new BadRequestException("Template name is required");

    const existing = await this.prisma.projectWhatsappTemplate.findUnique({
      where: { projectId_name: { projectId, name: cleanName } }
    });
    if (existing) throw new BadRequestException(`Template "${cleanName}" already exists for this project`);

    return this.prisma.projectWhatsappTemplate.create({
      data: {
        projectId,
        name: cleanName,
        displayName: data.displayName.trim() || cleanName,
        language: data.language?.trim() || "en_US",
        description: data.description?.trim() || null
      }
    });
  }

  async updateWhatsappTemplate(
    userId: string,
    projectId: string,
    templateId: string,
    data: { name: string; displayName: string; language?: string; description?: string }
  ) {
    const member = await this.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot edit templates");
    const template = await this.prisma.projectWhatsappTemplate.findFirst({ where: { id: templateId, projectId } });
    if (!template) throw new NotFoundException("Template not found");
    const name = data.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!name) throw new BadRequestException("Template name is required");
    const duplicate = await this.prisma.projectWhatsappTemplate.findUnique({ where: { projectId_name: { projectId, name } } });
    if (duplicate && duplicate.id !== templateId) throw new BadRequestException(`Template "${name}" already exists for this project`);
    return this.prisma.projectWhatsappTemplate.update({
      where: { id: templateId },
      data: {
        name,
        displayName: data.displayName.trim() || name,
        language: data.language?.trim() || "en_US",
        description: data.description?.trim() || null
      }
    });
  }

  async deleteWhatsappTemplate(userId: string, projectId: string, templateId: string) {
    const member = await this.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot delete templates");

    const template = await this.prisma.projectWhatsappTemplate.findFirst({
      where: { id: templateId, projectId }
    });
    if (!template) throw new NotFoundException("Template not found");

    await this.prisma.projectWhatsappTemplate.delete({
      where: { id: templateId }
    });
    return { success: true };
  }
}
