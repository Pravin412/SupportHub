import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AutomationMode, ConversationStatus, Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { SupportEvent } from "../../common/events/support-events";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";
import { buildSearchFilter } from "../../common/search/search-filters";
import { WhatsappService } from "../../common/whatsapp/whatsapp.service";
import { ProjectService } from "../project/project.service";

function parseEmailList(value?: string | null) {
  return Array.from(new Set((value ?? "").split(/[\s,;]+/).map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))));
}

const ticketSearchFields = [
  (match: Prisma.StringFilter) => ({ id: match }),
  (match: Prisma.StringFilter) => ({ title: match }),
  (match: Prisma.StringFilter) => ({ conversation: { contact: { name: match } } }),
  (match: Prisma.StringFilter) => ({ conversation: { contact: { phone: match } } })
];

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private prisma: PrismaService,
    private queues: QueueService,
    private realtime: RealtimeGateway,
    private whatsapp: WhatsappService,
    private projects: ProjectService
  ) {}

  async tickets(userId: string, projectId?: string, search?: string) {
    const scopedProject = projectId ?? (await this.projects.projects(userId))[0]?.id;
    if (!scopedProject) return [];
    await this.projects.assertMember(userId, scopedProject);
    return this.prisma.ticket.findMany({
      where: { projectId: scopedProject, ...buildSearchFilter<Prisma.TicketWhereInput>(search, ticketSearchFields as any) },
      take: 50,
      orderBy: { createdAt: "desc" },
      select: { id: true, projectId: true, conversationId: true, title: true, status: true, createdAt: true, updatedAt: true, conversation: { select: { contact: { select: { name: true, phone: true } } } } }
    }).then((rows) =>
      rows.map((t) => ({ id: t.id, projectId: t.projectId, conversationId: t.conversationId, title: t.title, status: t.status, createdAt: t.createdAt, updatedAt: t.updatedAt, customerName: t.conversation.contact.name ?? "Customer", customerPhone: t.conversation.contact.phone ?? null }))
    );
  }

  async createTicket(userId: string, conversationId: string, data: Pick<Prisma.TicketCreateInput, "title" | "priority">) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException();
    await this.projects.assertMember(userId, c.projectId);

    const existingActiveTicket = await this.prisma.ticket.findFirst({ where: { conversationId, status: { notIn: ["RESOLVED", "CLOSED"] } }, orderBy: { createdAt: "desc" } });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN, lastMessageAt: new Date() } });
    if (existingActiveTicket) return existingActiveTicket;

    const ticket = await this.prisma.ticket.create({ data: { projectId: c.projectId, conversationId, contactId: c.contactId, title: data.title, priority: data.priority } });
    this.realtime.emitProject(c.projectId, SupportEvent.TicketCreated, ticket);
    await this.queueTicketEmail(c.projectId, "created", ticket);
    await this.queueTicketWhatsapp(c.projectId, "created", ticket);
    return ticket;
  }

  async updateTicketStatus(userId: string, ticketId: string, status: TicketStatus) {
    const current = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!current) throw new NotFoundException("Ticket not found");
    await this.projects.assertMember(userId, current.projectId);

    const ticket = await this.prisma.ticket.update({ where: { id: ticketId }, data: { status } });

    if (status === "RESOLVED" || status === "CLOSED") {
      await this.prisma.ticket.updateMany({ where: { conversationId: ticket.conversationId, id: { not: ticket.id }, status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] } }, data: { status } });
      const activeTicketCount = await this.prisma.ticket.count({ where: { conversationId: ticket.conversationId, status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] } } });
      if (activeTicketCount === 0) {
        const resolved = await this.prisma.conversation.update({ where: { id: ticket.conversationId }, data: { status: ConversationStatus.RESOLVED, automationMode: AutomationMode.AUTOMATED } });
        this.realtime.emitConversation(ticket.conversationId, SupportEvent.ConversationAssigned, resolved);
      }
    } else {
      await this.prisma.conversation.update({ where: { id: ticket.conversationId }, data: { status: ConversationStatus.OPEN, automationMode: AutomationMode.HUMAN } });
    }

    if (current.status !== ticket.status) await this.queueTicketEmail(ticket.projectId, "status", ticket, current.status);
    return ticket;
  }

  async queueTicketEmail(projectId: string, event: "created" | "status", ticket: { id: string; title: string; status: TicketStatus }, oldStatus?: TicketStatus) {
    const settings = await this.prisma.projectNotificationSettings.findUnique({ where: { projectId } });
    const enabled = event === "created" ? settings?.ticketCreatedEnabled === true : settings?.ticketAssignedEnabled === true;
    if (!enabled) return;
    const smtp = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
    if (!smtp?.enabled || !smtp.smtpHost || !smtp.smtpUser || !smtp.smtpPassword) return;

    const [globalAdmins, projectMembers] = await Promise.all([
      this.prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } }),
      this.prisma.projectMember.findMany({ where: { projectId, role: { in: ["PROJECT_ADMIN", "PROJECT_AGENT"] } }, select: { emailNotificationsEnabled: true, user: { select: { email: true } } } })
    ]);
    const disabledEmails = new Set(projectMembers.filter((m) => !m.emailNotificationsEnabled).map((m) => m.user.email.toLowerCase()));
    const recipients = Array.from(new Set([...globalAdmins.map((a) => a.email), ...projectMembers.filter((m) => m.emailNotificationsEnabled).map((m) => m.user.email), ...parseEmailList(settings?.notificationEmail)]))
      .filter((e) => e.toLowerCase() !== "admin@gmail.com")
      .filter((e) => !disabledEmails.has(e.toLowerCase()))
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (!recipients.length) return;

    const ticketDetails = await this.prisma.ticket.findUnique({ where: { id: ticket.id }, select: { title: true, status: true, conversation: { select: { contact: { select: { name: true, phone: true } } } } } });
    const customerName = ticketDetails?.conversation?.contact?.name?.trim() || "Customer";
    const mobileNumber = ticketDetails?.conversation?.contact?.phone?.trim() || "Not provided";
    const subject = event === "created" ? `${customerName} raised a ticket` : `${customerName}'s ticket status changed`;
    const text = event === "created"
      ? `${customerName} raised a ticket.\n\nMobile number: ${mobileNumber}\nTicket: ${ticketDetails?.title ?? ticket.title}\nStatus: ${ticketDetails?.status ?? ticket.status}`
      : `${customerName}'s ticket status changed from ${oldStatus} to ${ticketDetails?.status ?? ticket.status}.\n\nMobile number: ${mobileNumber}\nTicket: ${ticketDetails?.title ?? ticket.title}`;

    await Promise.all(recipients.map((to) => this.queues.queueEmail(projectId, to, subject, text)));
  }

  async queueTicketWhatsapp(projectId: string, event: "created" | "status", ticket: { id: string; title: string; status: TicketStatus; priority?: TicketPriority }) {
    if (event === "created") {
      try {
        await this.whatsapp.sendTicketCreatedNotification(projectId, ticket);
      } catch (err) {
        this.logger.error(`[whatsapp] Error dispatching ticket notification for project ${projectId}`, err);
      }
    }
  }
}
