import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { buildSearchFilter } from "../../common/search/search-filters";

export type DashboardRange = "today" | "week" | "month" | "all";

const ticketSearchFields = [
  (match: Prisma.StringFilter) => ({ id: match }),
  (match: Prisma.StringFilter) => ({ title: match }),
  (match: Prisma.StringFilter) => ({ conversation: { contact: { name: match } } }),
  (match: Prisma.StringFilter) => ({ conversation: { contact: { phone: match } } })
];

const messageSearchFields = [
  (match: Prisma.StringFilter) => ({ content: match })
];

export const widgetChannelPublicSelect = {
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

export function makeChannelId(key: string) {
  const random = Math.random().toString(36).slice(2, 8);
  return `ch_${key.replace(/[^a-z0-9]/g, "").slice(0, 12)}_${random}`;
}

function dashboardDateFilter(range: DashboardRange = "all") {
  if (range === "all") return undefined;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "week") start.setDate(start.getDate() - 6);
  if (range === "month") start.setDate(1);
  return { gte: start };
}

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService
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
      })
    );
  }

  async dashboardSummary(userId: string, range: DashboardRange = "all") {
    const projects = await this.projects(userId);
    const projectIds = projects.map((p) => p.id);
    const createdAt = dashboardDateFilter(range);
    const conversationWhere = { projectId: { in: projectIds }, ...(createdAt ? { createdAt } : {}) };
    const ticketWhere = { projectId: { in: projectIds }, ...(createdAt ? { createdAt } : {}) };

    if (!projectIds.length) {
      return { projectsCount: 0, conversationsCount: 0, openConversationsCount: 0, unreadConversationsCount: 0, ticketsCount: 0, openTicketsCount: 0, agentsCount: 0, activeChannelsCount: 0 };
    }

    const [conversationsCount, openConversationsCount, unreadConversationsCount, ticketsCount, openTicketsCount, agentsCount, activeChannelsCount] = await Promise.all([
      this.prisma.conversation.count({ where: conversationWhere }),
      this.prisma.conversation.count({ where: { ...conversationWhere, status: { not: "RESOLVED" } } }),
      this.prisma.conversation.count({ where: { ...conversationWhere, unreadCount: { gt: 0 } } }),
      this.prisma.ticket.count({ where: ticketWhere }),
      this.prisma.ticket.count({ where: { ...ticketWhere, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      this.prisma.projectMember.count({ where: { projectId: { in: projectIds } } }),
      this.prisma.widgetChannel.count({ where: { projectId: { in: projectIds }, enabled: true } })
    ]);

    return { projectsCount: projects.length, conversationsCount, openConversationsCount, unreadConversationsCount, ticketsCount, openTicketsCount, agentsCount, activeChannelsCount };
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
        widgetChannel: { create: { channelId: makeChannelId(key), colorTheme: "#2563EB", name: `${data.name} Website` } }
      } as Prisma.ProjectCreateInput,
      select: { id: true, name: true, key: true, integrationKey: true, widgetChannel: { select: { id: true, channelId: true, name: true, enabled: true, welcomeMessage: true } } }
    });
    return { ...project, integrationSecret: secret };
  }

  async deleteProject(userId: string, projectId: string) {
    await this.assertGlobalAdmin(userId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { ok: true, deletedId: projectId };
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

  async deleteContact(userId: string, projectId: string, contactId: string) {
    await this.assertMember(userId, projectId);
    await this.prisma.contact.delete({ where: { id: contactId, projectId } });
    return { ok: true, deletedId: contactId };
  }

  async channels(userId: string, projectId: string) {
    await this.assertMember(userId, projectId);
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true, key: true, name: true } });
    if (!project) throw new NotFoundException();

    const channelSelect = { id: true, channelId: true, name: true, enabled: true, websiteUrl: true, welcomeMessage: true, colorTheme: true, logoUrl: true, collectVisitorInfo: true, visitorNameEnabled: true, visitorEmailEnabled: true, visitorPhoneEnabled: true, launcherPosition: true, createdAt: true } satisfies Prisma.WidgetChannelSelect;

    const widgetChannel =
      (await this.prisma.widgetChannel.findUnique({ where: { projectId }, select: channelSelect })) ??
      (await this.prisma.widgetChannel.create({ data: { projectId, channelId: makeChannelId(project.key), name: `${project.name} Website`, colorTheme: "#2563EB" }, select: channelSelect }));

    const visitorSettings = {
      collectVisitorInfo: widgetChannel.collectVisitorInfo ?? false,
      visitorNameEnabled: widgetChannel.visitorNameEnabled ?? true,
      visitorEmailEnabled: widgetChannel.visitorEmailEnabled ?? true,
      visitorPhoneEnabled: widgetChannel.visitorPhoneEnabled ?? false
    };
    return [{ type: "WEBSITE_WIDGET", projectId: project.id, projectKey: project.key, ...widgetChannel, ...visitorSettings }];
  }

  async integrationCredentials(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { integrationKey: true, integrationSecret: true, integrationRevokedAt: true } as Prisma.ProjectSelect });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  async rotateIntegrationSecret(userId: string, projectId: string) {
    await this.assertProjectAdmin(userId, projectId);
    const secret = this.crypto.randomToken();
    return this.prisma.project.update({
      where: { id: projectId },
      data: { integrationSecret: secret, integrationRevokedAt: null } as Prisma.ProjectUpdateInput,
      select: { integrationKey: true, integrationSecret: true, integrationRevokedAt: true } as Prisma.ProjectSelect
    });
  }

  async updateWidget(userId: string, projectId: string, data: { welcomeMessage?: string; colorTheme?: string; logoUrl?: string; collectVisitorInfo?: boolean; visitorNameEnabled?: boolean; visitorEmailEnabled?: boolean; visitorPhoneEnabled?: boolean }) {
    await this.assertProjectAdmin(userId, projectId);
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { key: true, name: true } });
    if (!project) throw new NotFoundException("Project not found");
    const existing = await this.prisma.widgetChannel.findUnique({ where: { projectId }, select: { id: true } });
    return existing
      ? this.prisma.widgetChannel.update({ where: { id: existing.id }, data, select: widgetChannelPublicSelect })
      : this.prisma.widgetChannel.create({ data: { projectId, channelId: makeChannelId(project.key), name: `${project.name} Website`, colorTheme: data.colorTheme ?? "#2563EB", ...data }, select: widgetChannelPublicSelect });
  }

  async globalSearch(userId: string, query: string) {
    if (!query?.trim()) return { projects: [], tickets: [], contacts: [], conversations: [] };
    const searchQuery = query.trim();
    const userProjects = await this.projects(userId);
    const projectIds = userProjects.map((p) => p.id);
    if (!projectIds.length) return { projects: [], tickets: [], contacts: [], conversations: [] };

    const [projects, tickets, contacts, conversations] = await Promise.all([
      this.prisma.project.findMany({ where: { id: { in: projectIds }, ...buildSearchFilter<Prisma.ProjectWhereInput>(searchQuery, [(m) => ({ name: m }), (m) => ({ key: m })]) }, take: 5, select: { id: true, name: true, key: true } }),
      this.prisma.ticket.findMany({ where: { projectId: { in: projectIds }, ...buildSearchFilter<Prisma.TicketWhereInput>(searchQuery, ticketSearchFields as any) }, take: 5, select: { id: true, title: true, status: true, projectId: true } }),
      this.prisma.contact.findMany({ where: { projectId: { in: projectIds }, ...buildSearchFilter<Prisma.ContactWhereInput>(searchQuery, [(m) => ({ name: m }), (m) => ({ email: m }), (m) => ({ phone: m })]) }, take: 5, select: { id: true, name: true, email: true, phone: true, projectId: true } }),
      this.prisma.conversation.findMany({ where: { projectId: { in: projectIds }, messages: { some: buildSearchFilter(searchQuery, messageSearchFields as any) } }, take: 5, select: { id: true, projectId: true, contact: { select: { name: true } }, messages: { where: buildSearchFilter(searchQuery, messageSearchFields as any), take: 1, select: { content: true } } } })
    ]);

    return { projects, tickets, contacts, conversations };
  }
}
