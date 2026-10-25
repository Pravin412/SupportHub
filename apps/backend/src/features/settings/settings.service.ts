import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { QueueService } from "../../common/queue/queue.service";
import { WhatsappService } from "../../common/whatsapp/whatsapp.service";
import { parsePhoneList } from "../../common/whatsapp/phone.utils";
import { ProjectService } from "../project/project.service";

function parseEmailList(value?: string | null) {
  return Array.from(new Set((value ?? "").split(/[\s,;]+/).map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))));
}

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private queues: QueueService,
    private whatsapp: WhatsappService,
    private projects: ProjectService
  ) {}

  async notificationSettings(userId: string, projectId: string) {
    await this.projects.assertProjectAdmin(userId, projectId);
    const settings = await this.prisma.projectNotificationSettings.findUnique({ where: { projectId }, select: { notificationEmail: true, ticketCreatedEnabled: true, ticketAssignedEnabled: true, conversationAssignedEnabled: true, messageReceivedEnabled: true } });
    if (!settings) return null;
    return { ...settings, notificationEmails: parseEmailList(settings.notificationEmail) };
  }

  async updateNotificationSettings(userId: string, projectId: string, data: { notificationEmail: string; ticketCreatedEnabled?: boolean; ticketAssignedEnabled?: boolean; conversationAssignedEnabled?: boolean; messageReceivedEnabled?: boolean }) {
    await this.projects.assertProjectAdmin(userId, projectId);
    const emails = parseEmailList(data.notificationEmail);
    if (!emails.length) throw new BadRequestException("Add at least one valid notification email.");

    if (data.ticketCreatedEnabled || data.ticketAssignedEnabled) {
      const smtp = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
      if (!smtp?.enabled || !smtp.smtpHost || !smtp.smtpUser || !smtp.smtpPassword) {
        throw new BadRequestException("You should first configure Email SMTP Settings. Once you fill this, then only you can enable ticket emails.");
      }
    }

    const settings = await this.prisma.projectNotificationSettings.upsert({
      where: { projectId },
      update: { notificationEmail: emails.join(","), ticketCreatedEnabled: data.ticketCreatedEnabled, ticketAssignedEnabled: data.ticketAssignedEnabled, conversationAssignedEnabled: data.conversationAssignedEnabled, messageReceivedEnabled: data.messageReceivedEnabled },
      create: { projectId, notificationEmail: emails.join(","), ticketCreatedEnabled: data.ticketCreatedEnabled ?? false, ticketAssignedEnabled: data.ticketAssignedEnabled ?? false, conversationAssignedEnabled: data.conversationAssignedEnabled ?? true, messageReceivedEnabled: data.messageReceivedEnabled ?? false },
      select: { notificationEmail: true, ticketCreatedEnabled: true, ticketAssignedEnabled: true, conversationAssignedEnabled: true, messageReceivedEnabled: true }
    });
    return { ...settings, notificationEmails: emails };
  }

  async emailSettings(userId: string, projectId: string) {
    await this.projects.assertMember(userId, projectId);
    const settings = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
    if (!settings) return null;
    const { smtpPassword, ...rest } = settings;
    return rest;
  }

  async updateEmailSettings(userId: string, projectId: string, data: { smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpUser: string; smtpPassword?: string; fromName?: string }) {
    const member = await this.projects.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot update email settings");
    const existing = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
    const smtpPassword = data.smtpPassword ? this.crypto.encryptSecret(data.smtpPassword) : existing?.smtpPassword;
    if (!smtpPassword) throw new BadRequestException("SMTP password is required");
    return this.prisma.projectEmailSettings.upsert({
      where: { projectId },
      create: { projectId, smtpHost: data.smtpHost, smtpPort: data.smtpPort, smtpSecure: data.smtpSecure, smtpUser: data.smtpUser, smtpPassword, fromName: data.fromName },
      update: { smtpHost: data.smtpHost, smtpPort: data.smtpPort, smtpSecure: data.smtpSecure, smtpUser: data.smtpUser, smtpPassword, fromName: data.fromName }
    });
  }

  async testEmailSettings(userId: string, projectId: string) {
    const member = await this.projects.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot test email settings");
    const settings = await this.prisma.projectEmailSettings.findUnique({ where: { projectId } });
    if (!settings?.enabled || !settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) throw new BadRequestException("No complete email SMTP settings configured for this project");
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    const testRecipient = user.email.toLowerCase() === "admin@gmail.com" ? (process.env.BCC_EMAIL || user.email) : user.email;
    await this.queues.queueEmail(projectId, testRecipient, "Test Email from SupportHub", "If you are seeing this, your project's custom SMTP configuration is working correctly!");
    return { success: true, message: `Test email queued successfully to ${testRecipient}` };
  }

  async whatsappSettings(userId: string, projectId: string) {
    const member = await this.projects.assertMember(userId, projectId);
    const settings = await this.prisma.projectWhatsappSettings.findUnique({ where: { projectId } });
    if (!settings) return { id: null, projectId, enabled: false, ticketCreatedEnabled: false, recipientPhoneNumbers: [], ticketCreatedTemplateId: null, providerUrl: null, vendorId: null, accessToken: null, hasCustomToken: false, isConfigured: false };
    const { accessToken, ...rest } = settings;
    return { ...rest, accessToken: accessToken && (member.role === "ADMIN" || member.role === "PROJECT_ADMIN") ? this.crypto.decryptSecret(accessToken) : null, hasCustomToken: Boolean(accessToken), isConfigured: Boolean(settings.enabled && settings.vendorId?.trim() && accessToken?.trim()) };
  }

  async updateWhatsappSettings(userId: string, projectId: string, data: { enabled?: boolean; ticketCreatedEnabled?: boolean; recipientPhoneNumbers?: string[]; ticketCreatedTemplateId?: string | null; providerUrl?: string | null; vendorId?: string | null; accessToken?: string | null }) {
    const member = await this.projects.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot update WhatsApp settings");
    const existing = await this.prisma.projectWhatsappSettings.findUnique({ where: { projectId } });
    let encryptedToken = existing?.accessToken ?? null;
    if (data.accessToken?.trim()) encryptedToken = this.crypto.encryptSecret(data.accessToken.trim());
    else if (data.accessToken === "") encryptedToken = null;

    const willEnableGateway = data.enabled ?? existing?.enabled ?? false;
    if (data.ticketCreatedEnabled || willEnableGateway) {
      const willHaveVendor = data.vendorId !== undefined ? Boolean(data.vendorId?.trim()) : Boolean(existing?.vendorId?.trim());
      if (!willHaveVendor || !encryptedToken) throw new BadRequestException("You should first configure WhatsApp Gateway Settings (Vendor ID and Access Token). Once you fill this, then only you can enable WhatsApp notifications.");
    }

    return this.prisma.projectWhatsappSettings.upsert({
      where: { projectId },
      create: { projectId, enabled: data.enabled ?? data.ticketCreatedEnabled ?? false, ticketCreatedEnabled: data.ticketCreatedEnabled ?? false, recipientPhoneNumbers: parsePhoneList(data.recipientPhoneNumbers), ticketCreatedTemplateId: data.ticketCreatedTemplateId ?? null, providerUrl: data.providerUrl ?? null, vendorId: data.vendorId ?? null, accessToken: encryptedToken },
      update: { enabled: data.enabled ?? undefined, ticketCreatedEnabled: data.ticketCreatedEnabled ?? undefined, recipientPhoneNumbers: data.recipientPhoneNumbers !== undefined ? parsePhoneList(data.recipientPhoneNumbers) : undefined, ticketCreatedTemplateId: data.ticketCreatedTemplateId !== undefined ? data.ticketCreatedTemplateId : undefined, providerUrl: data.providerUrl !== undefined ? data.providerUrl : undefined, vendorId: data.vendorId !== undefined ? data.vendorId : undefined, accessToken: encryptedToken }
    });
  }

  async testWhatsappSettings(userId: string, projectId: string, targetPhone?: string) {
    const member = await this.projects.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot test WhatsApp settings");
    const settings = await this.prisma.projectWhatsappSettings.findUnique({ where: { projectId } });
    if (!settings?.enabled || !settings.vendorId?.trim() || !settings.accessToken?.trim()) throw new BadRequestException("You should first configure WhatsApp Gateway Settings (Vendor ID and Access Token) for this project.");
    const recipients = parsePhoneList(targetPhone || settings?.recipientPhoneNumbers);
    if (!recipients.length) throw new BadRequestException("Please provide a recipient phone number with country code for testing");
    const phone = recipients[0];
    let templateName = "ticket_alert";
    let language = "en_US";
    if (settings?.ticketCreatedTemplateId) {
      const tmpl = await this.prisma.projectWhatsappTemplate.findFirst({ where: { projectId, OR: [{ id: settings.ticketCreatedTemplateId }, { name: settings.ticketCreatedTemplateId }] } });
      if (tmpl) { templateName = tmpl.name; language = tmpl.language; }
    }
    const result = await this.whatsapp.sendTemplateMessage({ projectId, phoneNumber: phone, templateName, language, fields: ["Test Customer", "test@example.com", `${phone} (MEDIUM - OPEN)`, "SupportHub WhatsApp Verification | Ticket ID: TEST"] });
    if (!result.success) throw new BadRequestException(result.message || "WhatsApp test message failed");
    return result;
  }

  async whatsappTemplates(userId: string, projectId: string) {
    await this.projects.assertMember(userId, projectId);
    return this.prisma.projectWhatsappTemplate.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
  }

  async createWhatsappTemplate(userId: string, projectId: string, data: { name: string; displayName: string; language?: string; description?: string }) {
    const member = await this.projects.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot create templates");
    const cleanName = data.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!cleanName) throw new BadRequestException("Template name is required");
    const existing = await this.prisma.projectWhatsappTemplate.findUnique({ where: { projectId_name: { projectId, name: cleanName } } });
    if (existing) throw new BadRequestException(`Template "${cleanName}" already exists for this project`);
    return this.prisma.projectWhatsappTemplate.create({ data: { projectId, name: cleanName, displayName: data.displayName.trim() || cleanName, language: data.language?.trim() || "en_US", description: data.description?.trim() || null } });
  }

  async updateWhatsappTemplate(userId: string, projectId: string, templateId: string, data: { name: string; displayName: string; language?: string; description?: string }) {
    const member = await this.projects.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot edit templates");
    const template = await this.prisma.projectWhatsappTemplate.findFirst({ where: { id: templateId, projectId } });
    if (!template) throw new NotFoundException("Template not found");
    const name = data.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!name) throw new BadRequestException("Template name is required");
    const duplicate = await this.prisma.projectWhatsappTemplate.findUnique({ where: { projectId_name: { projectId, name } } });
    if (duplicate && duplicate.id !== templateId) throw new BadRequestException(`Template "${name}" already exists for this project`);
    return this.prisma.projectWhatsappTemplate.update({ where: { id: templateId }, data: { name, displayName: data.displayName.trim() || name, language: data.language?.trim() || "en_US", description: data.description?.trim() || null } });
  }

  async deleteWhatsappTemplate(userId: string, projectId: string, templateId: string) {
    const member = await this.projects.assertMember(userId, projectId);
    if (member.role === "PROJECT_AGENT") throw new ForbiddenException("Agents cannot delete templates");
    const template = await this.prisma.projectWhatsappTemplate.findFirst({ where: { id: templateId, projectId } });
    if (!template) throw new NotFoundException("Template not found");
    await this.prisma.projectWhatsappTemplate.delete({ where: { id: templateId } });
    return { success: true };
  }
}
