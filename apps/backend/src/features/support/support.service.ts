import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";

function channelPublicId(key: string) {
  const random = Math.random().toString(36).slice(2, 8);
  return `ch_${key.replace(/[^a-z0-9]/g, "").slice(0, 12)}_${random}`;
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
    const key = (data.key ?? data.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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

  async channels(userId: string, projectId: string) {
    await this.assertMember(userId, projectId);
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        key: true,
        name: true,
        widgetChannel: {
          select: {
            id: true,
            publicId: true,
            name: true,
            enabled: true,
            websiteUrl: true,
            welcomeMessage: true,
            colorTheme: true,
            launcherPosition: true,
            createdAt: true
          }
        }
      }
    });
    if (!project) throw new NotFoundException();
    const widgetChannel =
      project.widgetChannel ??
      (await this.db.widgetChannel.create({
        data: { projectId, publicId: channelPublicId(project.key), name: `${project.name} Website` },
        select: {
          id: true,
          publicId: true,
          name: true,
          enabled: true,
          websiteUrl: true,
          welcomeMessage: true,
          colorTheme: true,
          launcherPosition: true,
          createdAt: true
        }
      }));
    return [{ type: "WEBSITE_WIDGET", projectId: project.id, projectKey: project.key, ...widgetChannel }];
  }

  async updateWidget(userId: string, projectId: string, data: { welcomeMessage?: string; colorTheme?: string }) {
    await this.assertMember(userId, projectId);
    const channel = await this.db.widgetChannel.findUnique({ where: { projectId } });
    if (!channel) throw new NotFoundException("Widget channel not found");
    return this.db.widgetChannel.update({
      where: { id: channel.id },
      data: {
        welcomeMessage: data.welcomeMessage,
        colorTheme: data.colorTheme
      }
    });
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
    this.realtime.emitProject(c.projectId, "message.created", msg);
    this.realtime.emitConversation(conversationId, "message.created", msg);
    await this.queues.queueWebhook("message.created", c.projectId, msg);
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
    this.realtime.emitProject(c.projectId, "ticket.created", ticket);
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
        events: ["message.created", "ticket.created", "conversation.assigned"]
      },
      select: { id: true, url: true, enabled: true, events: true, secret: true }
    });
    return { ...webhook, signingSecret };
  }

  async widgetConfig(channelId: string) {
    const channel = await this.db.widgetChannel.findUnique({
      where: { publicId: channelId },
      include: { project: { include: { botConfiguration: true } } }
    });
    if (!channel || !channel.enabled) throw new NotFoundException("Widget offline");
    return {
      name: channel.name,
      welcomeMessage: channel.welcomeMessage,
      colorTheme: channel.colorTheme,
      launcherPosition: channel.launcherPosition,
      botName: channel.project.botConfiguration?.botName ?? "Support Bot"
    };
  }

  async widgetMessages(channelId: string, profileId: string) {
    if (!profileId) return [];
    const channel = await this.db.widgetChannel.findUnique({ where: { publicId: channelId } });
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

  async widgetSendMessage(channelId: string, profileId: string, content: string, name?: string, number?: string) {
    const channel = await this.db.widgetChannel.findUnique({ where: { publicId: channelId } });
    if (!channel || !channel.enabled) throw new NotFoundException();

    const shortCode = profileId.replace(/^guest-/, "").slice(0, 4).toUpperCase();
    const contactName = name?.trim() || `Visitor #${shortCode}`;

    const contact = await this.db.contact.upsert({
      where: { projectId_externalUserId: { projectId: channel.projectId, externalUserId: profileId } },
      create: { projectId: channel.projectId, externalUserId: profileId, name: contactName, phone: number },
      update: { name: name?.trim() || undefined, phone: number }
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
    this.realtime.emitProject(channel.projectId, "message.created", msg);
    
    // Try emitting to widget (requires realtime gateway update)
    this.realtime.emitConversation(conversation.id, "message.created", msg);

    await this.queues.queueWebhook("message.created", channel.projectId, msg);

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
            this.realtime.emitProject(channel.projectId, "message.created", botMsg);
            this.realtime.emitConversation(conversation.id, "message.created", botMsg);
          } catch {}
        }, 600);
      }
    }

    return msg;
  }
}
