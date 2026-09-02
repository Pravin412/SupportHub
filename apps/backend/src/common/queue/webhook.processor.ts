import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { CryptoService } from "../crypto/crypto.service";
import { PrismaService } from "../database/prisma.service";
import { ExternalWebhookEvent, SupportEvent, WebhookMessageType, WebhookSenderType } from "../events/support-events";

type WebhookJob = {
  projectId: string;
  payload: unknown;
};

@Injectable()
@Processor("webhook")
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private db: PrismaService,
    private crypto: CryptoService
  ) {
    super();
  }

  async process(job: Job<WebhookJob>) {
    const webhook = await this.db.webhook.findUnique({ where: { projectId: job.data.projectId } });
    const eventId = String(job.id);
    const eventName = job.name;
    const messageId = readPayloadId(job.data.payload);

    if (!webhook?.enabled || !webhook.url || !webhook.events.includes(eventName)) {
      this.logger.log(`[webhook] skipped event=${eventName} job=${eventId} project=${job.data.projectId} message=${messageId}`);
      return;
    }

    await this.db.webhookDelivery.upsert({
      where: { eventId },
      update: { attempts: job.attemptsMade + 1, status: "QUEUED" },
      create: { eventId, eventName, projectId: job.data.projectId, attempts: job.attemptsMade + 1 }
    });

    const timestamp = new Date().toISOString();
    
    const rawPayload = job.data.payload as Record<string, any> | undefined;

    let body: Record<string, any>;

    if (eventName === SupportEvent.MessageCreated || eventName === ExternalWebhookEvent.MessageCreated) {
      const message = await this.db.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          content: true,
          senderType: true,
          conversation: {
            select: {
              id: true,
              status: true,
              automationMode: true,
              contact: {
                select: {
                  name: true,
                  phone: true,
                  email: true
                }
              },
              project: {
                select: {
                  key: true
                }
              }
            }
          }
        }
      });

      const senderType = message?.senderType ?? rawPayload?.senderType;
      const isIncoming = senderType === "CUSTOMER" || !senderType;
      const contact = message?.conversation.contact;

      body = {
        event: ExternalWebhookEvent.MessageCreated,
        message_type: isIncoming ? WebhookMessageType.Incoming : WebhookMessageType.Outgoing,
        message: {
          id: message?.id ?? messageId,
          content: message?.content ?? rawPayload?.content ?? "",
          senderType: senderType ?? "CUSTOMER",
          content_attributes: {
            submitted_values: []
          }
        },
        conversation: {
          id: message?.conversation.id ?? rawPayload?.conversationId ?? "",
          status: message?.conversation.status ?? "OPEN",
          assignedTo: message?.conversation.automationMode === "HUMAN" ? "human" : "bot"
        },
        sender: {
          type: isIncoming ? WebhookSenderType.Contact : WebhookSenderType.Agent,
          name: contact?.name ?? "Customer",
          phone_number: contact?.phone ?? null,
          email: contact?.email ?? null
        },
        project_key: message?.conversation.project.key ?? ""
      };
    } else {
      body = {
        id: eventId,
        event: eventName,
        projectId: job.data.projectId,
        createdAt: timestamp,
        data: job.data.payload
      };
    }

    const signature = webhook.secret
      ? this.crypto.signWebhook(webhook.secret, eventId, timestamp, body)
      : undefined;

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-supporthub-event": eventName,
          "x-supporthub-event-id": eventId,
          "x-supporthub-timestamp": timestamp,
          ...(signature ? { "x-supporthub-signature": signature } : {})
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(webhook.timeoutMs)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const delivery = await this.db.webhookDelivery.update({ where: { eventId }, data: { status: "SENT" } });
      this.logger.log(
        `[webhook] sent event=${eventName} job=${eventId} delivery=${delivery.id} project=${job.data.projectId} message=${messageId} status=${response.status} url=${webhook.url}`
      );
    } catch (error) {
      const failedLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      await this.db.webhookDelivery.update({
        where: { eventId },
        data: { status: failedLastAttempt ? "FAILED" : "QUEUED" }
      });
      this.logger.error(
        `[webhook] failed event=${eventName} job=${eventId} project=${job.data.projectId} message=${messageId} url=${webhook.url}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  }
}

function readPayloadId(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("id" in payload)) return "unknown";
  const id = (payload as { id?: unknown }).id;
  return typeof id === "string" ? id : "unknown";
}
