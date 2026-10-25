import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { ProjectService } from "../project/project.service";

const agentSelect = { id: true, role: true, emailNotificationsEnabled: true, mobileNumber: true, whatsappNotificationsEnabled: true, user: { select: { id: true, name: true, email: true } } };

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private projects: ProjectService
  ) {}

  async agents(userId: string, projectId: string) {
    await this.projects.assertMember(userId, projectId);
    return this.prisma.projectMember.findMany({ where: { projectId }, select: agentSelect });
  }

  async lookupAgent(userId: string, projectId: string, email: string) {
    await this.projects.assertProjectAdmin(userId, projectId);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return { exists: false };
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, email: true, name: true } });
    return user ? { exists: true, user } : { exists: false };
  }

  async createAgent(userId: string, projectId: string, data: { email: string; name: string; password?: string; role?: Role; emailNotificationsEnabled?: boolean; mobileNumber?: string; whatsappNotificationsEnabled?: boolean }) {
    await this.projects.assertProjectAdmin(userId, projectId);
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const normalizedEmail = data.email.trim().toLowerCase();
    const requestedRole = data.role === "PROJECT_ADMIN" ? "PROJECT_ADMIN" : "PROJECT_AGENT";
    if (currentUser?.role !== "ADMIN" && requestedRole === "PROJECT_ADMIN") throw new ForbiddenException("Only admin can add project admins");

    const contact = this.parseAgentContact(data);
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!existingUser && !data.password) throw new BadRequestException("Password is required for a new user");

    const user = existingUser
      ? await this.prisma.user.update({ where: { id: existingUser.id }, data: { name: data.name || existingUser.name } })
      : await this.prisma.user.create({ data: { email: normalizedEmail, name: data.name, role: "PROJECT_AGENT", passwordHash: await this.crypto.hashSecret(data.password!) } });

    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      update: { role: requestedRole, emailNotificationsEnabled: data.emailNotificationsEnabled ?? false, ...contact },
      create: { projectId, userId: user.id, role: requestedRole, emailNotificationsEnabled: data.emailNotificationsEnabled ?? false, ...contact },
      select: agentSelect
    });
  }

  async updateAgentPassword(userId: string, projectId: string, memberId: string, password: string) {
    await this.projects.assertProjectAdmin(userId, projectId);
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const member = await this.prisma.projectMember.findUnique({ where: { id: memberId }, select: { projectId: true, role: true, userId: true } });
    if (!member || member.projectId !== projectId) throw new NotFoundException("Project user not found");
    if (currentUser?.role !== "ADMIN" && member.role === "PROJECT_ADMIN") throw new ForbiddenException("Only admin can reset project admin passwords");
    await this.prisma.user.update({ where: { id: member.userId }, data: { passwordHash: await this.crypto.hashSecret(password) } });
    return { ok: true };
  }

  async updateAgent(userId: string, projectId: string, memberId: string, data: { email: string; name: string; role: Role; emailNotificationsEnabled: boolean; mobileNumber?: string; whatsappNotificationsEnabled?: boolean }) {
    await this.projects.assertProjectAdmin(userId, projectId);
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const member = await this.prisma.projectMember.findUnique({ where: { id: memberId }, select: { projectId: true, role: true, userId: true } });
    if (!member || member.projectId !== projectId) throw new NotFoundException("Project user not found");
    if (member.role === "ADMIN") throw new ForbiddenException("Admin access cannot be edited here");
    if (currentUser?.role !== "ADMIN" && member.role === "PROJECT_ADMIN") throw new ForbiddenException("Only admin can edit project admins");

    const requestedRole = data.role === "PROJECT_ADMIN" ? "PROJECT_ADMIN" : "PROJECT_AGENT";
    if (currentUser?.role !== "ADMIN" && requestedRole === "PROJECT_ADMIN") throw new ForbiddenException("Only admin can make project admins");

    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existingUser && existingUser.id !== member.userId) throw new BadRequestException("Email is already used by another user");

    const contact = this.parseAgentContact(data);
    await this.prisma.user.update({ where: { id: member.userId }, data: { name: data.name.trim(), email: normalizedEmail } });
    return this.prisma.projectMember.update({ where: { id: memberId }, data: { role: requestedRole, emailNotificationsEnabled: data.emailNotificationsEnabled, ...contact }, select: agentSelect });
  }

  async removeAgent(userId: string, projectId: string, memberId: string) {
    await this.projects.assertProjectAdmin(userId, projectId);
    const currentUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const member = await this.prisma.projectMember.findUnique({ where: { id: memberId }, select: { projectId: true, role: true } });
    if (!member || member.projectId !== projectId) throw new NotFoundException("Project user not found");
    if (currentUser?.role !== "ADMIN" && member.role === "PROJECT_ADMIN") throw new ForbiddenException("Only admin can remove project admins");
    await this.prisma.projectMember.delete({ where: { id: memberId } });
    return { ok: true };
  }

  private parseAgentContact(data: { mobileNumber?: string; whatsappNotificationsEnabled?: boolean }) {
    const raw = data.mobileNumber?.trim() || "";
    const mobileNumber = raw.replace(/[\s()+-]/g, "");
    if (raw && !/^[1-9]\d{8,14}$/.test(mobileNumber)) throw new BadRequestException("Enter a valid mobile number including country code");
    if (data.whatsappNotificationsEnabled && !mobileNumber) throw new BadRequestException("A mobile number is required for WhatsApp notifications");
    return { mobileNumber: mobileNumber || null, whatsappNotificationsEnabled: !!mobileNumber && data.whatsappNotificationsEnabled === true };
  }
}
