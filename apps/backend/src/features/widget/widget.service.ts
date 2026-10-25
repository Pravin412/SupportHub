import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AutomationMode, ConversationStatus } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { SupportEvent } from "../../common/events/support-events";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";
import { widgetChannelPublicSelect } from "../project/project.service";
import { TicketService } from "../tickets/ticket.service";

function randomVisitorName(profileId: string, projectName?: string) {
  const clean = profileId.replace(/^guest-/, "").replace(/[^a-z0-9]/gi, "");
  const projectPrefix = (projectName || "supporthub").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 16);
  const code = clean.slice(0, 6).toUpperCase() || Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${projectPrefix || "supporthub"}-${code}`;
}

@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);

  constructor(
    private prisma: PrismaService,
    private queues: QueueService,
    private realtime: RealtimeGateway,
    private tickets: TicketService
  ) {}

  async widgetConfig(channelId: string) {
    const channel = await this.prisma.widgetChannel.findUnique({
      where: { channelId },
      select: { ...widgetChannelPublicSelect, project: { select: { id: true, name: true, botConfiguration: { select: { botName: true, botAvatar: true, fallbackMessage: true } } } } }
    });
    if (!channel || !channel.enabled) throw new NotFoundException("Widget offline");
    const botConfig = channel.project.botConfiguration;
    return {
      name: channel.name || channel.project.name,
      welcomeMessage: channel.welcomeMessage || botConfig?.fallbackMessage || "Hi, welcome in. Send us a message and our team will reply as soon as possible.",
      colorTheme: channel.colorTheme || "#2563EB",
      logoUrl: channel.logoUrl || null,
      launcherPosition: channel.launcherPosition,
      botName: botConfig?.botName || channel.name || channel.project.name || "Support Bot",
      botAvatar: botConfig?.botAvatar || null,
      collectVisitorInfo: channel.collectVisitorInfo,
      visitorNameEnabled: channel.visitorNameEnabled,
      visitorEmailEnabled: channel.visitorEmailEnabled,
      visitorPhoneEnabled: channel.visitorPhoneEnabled
    };
  }

  async widgetMessages(channelId: string, profileId: string) {
    if (!profileId) return [];
    const channel = await this.prisma.widgetChannel.findUnique({ where: { channelId }, select: { id: true, projectId: true } });
    if (!channel) throw new NotFoundException();
    const contact = await this.prisma.contact.findUnique({ where: { projectId_externalUserId: { projectId: channel.projectId, externalUserId: profileId } } });
    if (!contact) return [];
    const conversation = await this.prisma.conversation.findFirst({ where: { projectId: channel.projectId, contactId: contact.id }, orderBy: { createdAt: "desc" } });
    if (!conversation || conversation.status === ConversationStatus.RESOLVED) return [];
    return this.prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, take: 50 });
  }

  async widgetDelivered(channelId: string, profileId: string, messageIds: string[]) {
    const channel = await this.prisma.widgetChannel.findUnique({ where: { channelId }, select: { projectId: true, enabled: true } });
    if (!channel?.enabled) throw new NotFoundException();
    const messages = await this.prisma.message.findMany({
      where: { id: { in: messageIds }, senderType: { in: ["AGENT", "BOT"] }, status: { in: ["PENDING", "SENT"] }, conversation: { projectId: channel.projectId, contact: { externalUserId: profileId } } }
    });
    if (!messages.length) return { ok: true };
    await this.prisma.message.updateMany({ where: { id: { in: messages.map((m) => m.id) }, status: { in: ["PENDING", "SENT"] } }, data: { status: "DELIVERED" } });
    for (const message of messages) {
      const payload = { id: message.id, conversationId: message.conversationId, status: "DELIVERED" };
      this.realtime.emitProject(channel.projectId, SupportEvent.MessageDelivered, payload);
      this.realtime.emitConversation(message.conversationId, SupportEvent.MessageDelivered, payload);
    }
    return { ok: true };
  }

  async widgetSendMessage(channelId: string, profileId: string, content: string, name?: string, email?: string, number?: string) {
    this.logger.log(`[widget] received channel=${channelId} characters=${content.length}`);
    const channel = await this.prisma.widgetChannel.findUnique({ where: { channelId }, select: { id: true, projectId: true, enabled: true, project: { select: { name: true } } } });
    if (!channel?.enabled) throw new NotFoundException();

    const contactName = name?.trim() || randomVisitorName(profileId, channel.project.name);
    const contact = await this.prisma.contact.upsert({
      where: { projectId_externalUserId: { projectId: channel.projectId, externalUserId: profileId } },
      create: { projectId: channel.projectId, externalUserId: profileId, name: contactName, email: email?.trim() || undefined, phone: number?.trim() || undefined },
      update: { name: name?.trim() || undefined, email: email?.trim() || undefined, phone: number?.trim() || undefined }
    });

    let conversation = await this.prisma.conversation.findFirst({ where: { projectId: channel.projectId, contactId: contact.id }, orderBy: { createdAt: "desc" } });
    if (!conversation || conversation.status === ConversationStatus.RESOLVED) {
      conversation = await this.prisma.conversation.create({ data: { projectId: channel.projectId, contactId: contact.id, status: "PENDING" } });
    }

    const msg = await this.prisma.message.create({ data: { conversationId: conversation.id, senderType: "CUSTOMER", content } });
    this.logger.log(`[widget] saved project=${channel.projectId} conversation=${conversation.id} message=${msg.id}`);

    await this.prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date(), unreadCount: { increment: 1 } } });
    this.realtime.emitProject(channel.projectId, SupportEvent.MessageCreated, msg);
    this.realtime.emitConversation(conversation.id, SupportEvent.MessageCreated, msg);
    await this.queues.queueWebhook(SupportEvent.MessageCreated, channel.projectId, msg);
    this.logger.log(`[widget] webhook queued project=${channel.projectId} conversation=${conversation.id} message=${msg.id}`);

    const webhook = await this.prisma.webhook.findFirst({ where: { projectId: channel.projectId, isActive: true } });
    const botConfig = await this.prisma.botConfiguration.findUnique({ where: { projectId: channel.projectId } });

    const containsKeyword = Boolean(!webhook?.enabled && botConfig?.enabled && botConfig?.handoffKeywords.some((kw: string) => content.toLowerCase().includes(kw.toLowerCase())));
    const hasExternalBot = Boolean(webhook?.enabled);
    const hasInternalBot = Boolean(botConfig?.enabled && botConfig.responseMode !== "HUMAN");
    const needsHumanSupport = !hasExternalBot && !hasInternalBot;

    if (containsKeyword || needsHumanSupport) {
      await this.prisma.conversation.update({ where: { id: conversation.id }, data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN } });
      const existingOpenTicket = await this.prisma.ticket.findFirst({ where: { conversationId: conversation.id, status: { notIn: ["RESOLVED", "CLOSED"] } } });
      if (needsHumanSupport || !existingOpenTicket) {
        const ticket = await this.prisma.ticket.create({ data: { projectId: channel.projectId, conversationId: conversation.id, contactId: contact.id, title: `${needsHumanSupport ? "Support requested" : "Handoff requested"}: ${content.slice(0, 80)}`, priority: "MEDIUM" } });
        this.realtime.emitProject(channel.projectId, SupportEvent.TicketCreated, ticket);
        await this.tickets.queueTicketEmail(channel.projectId, "created", ticket);
        await this.tickets.queueTicketWhatsapp(channel.projectId, "created", ticket);
      }
    }

    if (botConfig?.enabled && botConfig.responseMode === "AUTOMATED" && botConfig.fallbackMessage && !containsKeyword && !needsHumanSupport) {
      const canBotReply = conversation.status === "PENDING" || conversation.status === "RESOLVED";
      if (canBotReply && (!webhook || !webhook.enabled)) {
        setTimeout(async () => {
          try {
            const botMsg = await this.prisma.message.create({ data: { conversationId: conversation.id, senderType: "BOT", content: botConfig.fallbackMessage, status: "SENT" } });
            await this.prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
            this.realtime.emitProject(channel.projectId, SupportEvent.MessageCreated, botMsg);
            this.realtime.emitConversation(conversation.id, SupportEvent.MessageCreated, botMsg);
          } catch { return undefined; }
        }, 600);
      }
    }

    return msg;
  }
}
