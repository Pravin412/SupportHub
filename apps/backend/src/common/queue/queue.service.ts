import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { SupportEvent } from "../events/support-events";

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue("webhook") private webhook: Queue,
    @InjectQueue("email") private email: Queue
  ) {}

  async queueWebhook(eventName: SupportEvent, projectId: string, payload: unknown) {
    const job = await this.webhook.add(
      eventName,
      { projectId, payload },
      { attempts: 3, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true }
    );
    this.logger.log(
      `[webhook] queued event=${eventName} job=${job.id} project=${projectId} message=${readPayloadId(payload)}`
    );
    return job;
  }

  queueEmail(projectId: string, to: string, subject: string) {
    return this.email.add(
      "email.send",
      { projectId, to, subject },
      { attempts: 3, backoff: { type: "exponential", delay: 1000 } }
    );
  }
}

function readPayloadId(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("id" in payload)) return "unknown";
  const id = (payload as { id?: unknown }).id;
  return typeof id === "string" ? id : "unknown";
}
