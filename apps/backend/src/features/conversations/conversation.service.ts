import { Injectable, NotFoundException } from "@nestjs/common";
import { AutomationMode, ConversationStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { SupportEvent } from "../../common/events/support-events";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";
import { buildSearchFilter } from "../../common/search/search-filters";
import { ProjectService } from "../project/project.service";

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private queues: QueueService,
    private realtime: RealtimeGateway,
    private projects: ProjectService
  ) {}

  async conversations(userId: string, projectId: string, cursor?: string, search?: string) {
    await this.projects.assertMember(userId, projectId);
    return this.prisma.conversation.findMany({
      where: { projectId, ...buildSearchFilter<Prisma.ConversationWhereInput>(search, [(m) => ({ contact: { name: m } })]) },
      take: 31,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { lastMessageAt: "desc" },
      distinct: ["contactId"],
      select: {
        id: true, projectId: true, contactId: true, status: true, automationMode: true, unreadCount: true, lastMessageAt: true,
        contact: { select: { name: true, phone: true, email: true, externalUserId: true } },
        messages: { take: 1, orderBy: { createdAt: "desc" }, select: { content: true } }
      }
    }).then((rows) =>
      rows.map((c) => ({
        id: c.id, projectId: c.projectId, contactId: c.contactId,
        contactName: c.contact?.name ?? "Customer",
        contactPhone: c.contact?.phone ?? null,
        contactEmail: c.contact?.email ?? null,
        externalUserId: c.contact?.externalUserId ?? null,
        status: c.status, automationMode: c.automationMode, unreadCount: c.unreadCount,
        lastMessageAt: c.lastMessageAt, preview: c.messages[0]?.content ?? ""
      }))
    );
  }

  async updateConversationStatus(userId: string, conversationId: string, status: ConversationStatus) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException();
    await this.projects.assertMember(userId, c.projectId);

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status,
        automationMode: status === ConversationStatus.RESOLVED ? AutomationMode.AUTOMATED : status === ConversationStatus.OPEN ? AutomationMode.HUMAN : undefined
      }
    });

    if (status === "RESOLVED") {
      await this.prisma.ticket.updateMany({ where: { conversationId, status: { notIn: ["RESOLVED", "CLOSED"] } }, data: { status: "RESOLVED" } });
    }

    this.realtime.emitProject(c.projectId, SupportEvent.ConversationAssigned, updated);
    this.realtime.emitConversation(conversationId, SupportEvent.ConversationAssigned, updated);
    return { ok: true };
  }

  async messages(userId: string, conversationId: string, cursor?: string) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId }, select: { projectId: true, contactId: true } });
    if (!c) throw new NotFoundException();
    await this.projects.assertMember(userId, c.projectId);

    const read = await this.prisma.conversation.updateMany({ where: { projectId: c.projectId, contactId: c.contactId, unreadCount: { gt: 0 } }, data: { unreadCount: 0 } });
    if (read.count) this.realtime.emitProject(c.projectId, SupportEvent.ConversationAssigned, { id: conversationId });

    const messages = await this.prisma.message.findMany({
      where: { conversation: { projectId: c.projectId, contactId: c.contactId } },
      take: 51,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: { conversation: true }
    });
    const sessions = new Map(messages.map((m) => [m.conversationId, m.conversation]));
    await this.confirmDelivery(c.projectId, messages.filter((m) => m.senderType === "CUSTOMER" && m.status !== "DELIVERED" && m.status !== "FAILED"));

    const history: Array<{ id: string; conversationId: string; content: string; senderType: string; status: string; createdAt: Date }> =
      messages.map(({ conversation, ...m }) => m);
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
    await this.projects.assertMember(userId, c.projectId);
    const msg = await this.prisma.message.create({ data: { conversationId, senderType: "AGENT", senderId: userId, content, status: "SENT" } });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date(), unreadCount: 0, status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN } });
    this.realtime.emitProject(c.projectId, SupportEvent.MessageCreated, msg);
    this.realtime.emitConversation(conversationId, SupportEvent.MessageCreated, msg);
    await this.queues.queueWebhook(SupportEvent.MessageCreated, c.projectId, msg);
    return msg;
  }

  async confirmDelivery(projectId: string, messages: Array<{ id: string; conversationId: string; status: string }>) {
    if (!messages.length) return;
    await this.prisma.message.updateMany({ where: { id: { in: messages.map((m) => m.id) }, status: { in: ["PENDING", "SENT"] } }, data: { status: "DELIVERED" } });
    for (const message of messages) {
      message.status = "DELIVERED";
      const payload = { id: message.id, conversationId: message.conversationId, status: "DELIVERED" };
      this.realtime.emitProject(projectId, SupportEvent.MessageDelivered, payload);
      this.realtime.emitConversation(message.conversationId, SupportEvent.MessageDelivered, payload);
    }
  }
}
