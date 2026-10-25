import { Injectable } from "@nestjs/common";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { SupportEvent } from "../../common/events/support-events";
import { ProjectService } from "../project/project.service";

@Injectable()
export class WebhookService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
    private projects: ProjectService
  ) {}

  async webhooks(userId: string, projectId: string) {
    await this.projects.assertProjectAdmin(userId, projectId);
    return this.prisma.webhook.findMany({
      where: { projectId },
      select: { id: true, name: true, url: true, isActive: true, enabled: true, events: true, timeoutMs: true, retryCount: true, secret: true }
    });
  }

  async createWebhook(userId: string, projectId: string, data: { name: string; url: string; isActive?: boolean }) {
    await this.projects.assertProjectAdmin(userId, projectId);
    if (data.isActive) await this.prisma.webhook.updateMany({ where: { projectId }, data: { isActive: false } });
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

  async updateWebhook(userId: string, projectId: string, webhookId: string, data: { name?: string; url?: string; isActive?: boolean }) {
    await this.projects.assertProjectAdmin(userId, projectId);
    if (data.isActive) await this.prisma.webhook.updateMany({ where: { projectId, id: { not: webhookId } }, data: { isActive: false } });
    return this.prisma.webhook.update({
      where: { id: webhookId, projectId },
      data: { name: data.name, url: data.url, isActive: data.isActive },
      select: { id: true, name: true, url: true, isActive: true, enabled: true, events: true, secret: true }
    });
  }

  async deleteWebhook(userId: string, projectId: string, webhookId: string) {
    await this.projects.assertProjectAdmin(userId, projectId);
    await this.prisma.webhook.delete({ where: { id: webhookId, projectId } });
    return { success: true };
  }
}
