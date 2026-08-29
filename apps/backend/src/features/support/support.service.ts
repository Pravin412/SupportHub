import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { SupportEvent } from "../../common/events/support-events";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";

function channelPublicId(key: string) {
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
  publicId: true,
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

@Injectable()
export class CoreService {
  constructor(
    private db: PrismaService,
    private queues: QueueService,
    private realtime: RealtimeGateway,
    private crypto: CryptoService
  ) {}

  async assertMember(userId: string, projectId: string) {
    const member = await this.db.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
    if (!member) throw new ForbiddenException("Project access denied");
    return member;
  }

  projects(userId: string) {
    return this.db.project.findMany({
      where: { members: { some: { userId } } },
      select: { id: true, name: true, key: true, widgetChannel: { select: { id: true, publicId: true, enabled: true } } }
    });
  }

  async dashboardSummary(userId: string) {
    const projects = await this.projects(userId);
    const projectIds = projects.map((project) => project.id);

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
      this.db.conversation.count({ where: { projectId: { in: projectIds } } }),
      this.db.conversation.count({ where: { projectId: { in: projectIds }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      this.db.conversation.count({ where: { projectId: { in: projectIds }, unreadCount: { gt: 0 } } }),
      this.db.ticket.count({ where: { projectId: { in: projectIds } } }),
      this.db.ticket.count({ where: { projectId: { in: projectIds }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
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
    const secret = this.crypto.randomToken();
    const cleanPrefix = data.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "").slice(0, 8);
    const uniqueSuffix = this.crypto.randomToken(8).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
    const key = data.key?.trim() ? data.key.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-") : `${cleanPrefix ? cleanPrefix + "-" : ""}${uniqueSuffix}`;

    const project = await this.db.project.create({
      data: {
        name: data.name,
        key,
        integrationKey: key,
        integrationSecretHash: await this.crypto.hashSecret(secret),
        members: { create: { userId, role: "ADMIN" } },
        botConfiguration: { create: { botName: `${data.name} Bot` } },
        widgetChannel: {
          create: {
            publicId: channelPublicId(key),
            name: `${data.name} Website`
          }
        }
      },
      select: {
        id: true,
        name: true,
        key: true,
        integrationKey: true,
        widgetChannel: { select: { id: true, publicId: true, name: true, enabled: true, welcomeMessage: true } }
      }
    });
    return { ...project, integrationSecret: secret };
  }

  async deleteProject(userId: string, projectId: string) {
    const member = await this.assertMember(userId, projectId);
    if (member.role !== "ADMIN") {
      throw new ForbiddenException("Only project admins can delete a project.");
    }
    await this.db.project.delete({
      where: { id: projectId }
    });
    return { ok: true, deletedId: projectId };
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
      publicId: true,
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
        data: { projectId, publicId: channelPublicId(project.key), name: `${project.name} Website` },
        select: channelSelect
      }));

    const visitorSettings = this.widgetVisitorSettings(widgetChannel);
    return [{ type: "WEBSITE_WIDGET", projectId: project.id, projectKey: project.key, ...widgetChannel, ...visitorSettings }];
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
    await this.assertMember(userId, projectId);
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
            publicId: channelPublicId(project.key),
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

  async createAgent(userId: string, projectId: string, data: { email: string; name: string }) {
    await this.assertMember(userId, projectId);
    const user = await this.db.user.upsert({
      where: { email: data.email },
      update: { name: data.name },
      create: { email: data.email, name: data.name, passwordHash: await this.crypto.hashSecret("SupportHub123!") }
    });
    return this.db.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      update: {},
      create: { projectId, userId: user.id, role: "SUPPORT_AGENT" },
      select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } }
    });
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
    await this.db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date(), unreadCount: 0 } });
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
    return ticket;
  }

  async tickets(userId: string, projectId?: string) {
    const scopedProject = projectId ?? (await this.projects(userId))[0]?.id;
    if (!scopedProject) return [];
    await this.assertMember(userId, scopedProject);
    return this.db.ticket.findMany({
      where: { projectId: scopedProject },
      take: 50,
      orderBy: { createdAt: "desc" }
    });
  }

  async webhook(userId: string, projectId: string) {
    await this.assertMember(userId, projectId);
    return this.db.webhook.findUnique({
      where: { projectId },
      select: { id: true, url: true, enabled: true, events: true, timeoutMs: true, retryCount: true, secret: true }
    });
  }

  async updateWebhook(userId: string, projectId: string, data: { url: string }) {
    await this.assertMember(userId, projectId);
    const signingSecret = this.crypto.randomToken();
    const webhook = await this.db.webhook.upsert({
      where: { projectId },
      update: { url: data.url, secretHash: await this.crypto.hashSecret(signingSecret), secret: signingSecret, enabled: true },
      create: {
        projectId,
        url: data.url,
        secretHash: await this.crypto.hashSecret(signingSecret),
        secret: signingSecret,
        events: [SupportEvent.MessageCreated, SupportEvent.TicketCreated, SupportEvent.ConversationAssigned]
      },
      select: { id: true, url: true, enabled: true, events: true, secret: true }
    });
    return { ...webhook, signingSecret };
  }

  async widgetConfig(channelId: string) {
    const channel = await this.db.widgetChannel.findUnique({
      where: { publicId: channelId },
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
      where: { publicId: channelId },
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
      where: { publicId: channelId },
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
        data: { projectId: channel.projectId, contactId: contact.id }
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

    // If botConfiguration is enabled and set to AUTOMATED (internal fallback bot)
    const botConfig = await this.db.botConfiguration.findUnique({ where: { projectId: channel.projectId } });
    if (botConfig && botConfig.enabled && botConfig.responseMode === "AUTOMATED" && botConfig.fallbackMessage) {
      // Check if project has no external webhook enabled or message has handoff keyword
      const webhook = await this.db.webhook.findUnique({ where: { projectId: channel.projectId } });
      const containsKeyword = botConfig.handoffKeywords.some((kw: string) => content.toLowerCase().includes(kw.toLowerCase()));
      
      // Auto-reply fallback if explicitly requested or if no webhook is active
      if (!webhook || !webhook.enabled || containsKeyword) {
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

    return msg;
  }

  private widgetVisitorSettings(channel: WidgetVisitorSettings): WidgetVisitorSettings {
    return {
      collectVisitorInfo: channel.collectVisitorInfo ?? defaultWidgetVisitorSettings.collectVisitorInfo,
      visitorNameEnabled: channel.visitorNameEnabled ?? defaultWidgetVisitorSettings.visitorNameEnabled,
      visitorEmailEnabled: channel.visitorEmailEnabled ?? defaultWidgetVisitorSettings.visitorEmailEnabled,
      visitorPhoneEnabled: channel.visitorPhoneEnabled ?? defaultWidgetVisitorSettings.visitorPhoneEnabled
    };
  }
}
