import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { PrismaService } from "../database/prisma.service";

@Processor("message-retention")
export class MessageRetentionProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(MessageRetentionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("message-retention") private readonly queue: Queue
  ) {
    super();
  }

  async onModuleInit() {
    const options = {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: 100
    };
    await this.queue.add("cleanup", {}, { ...options, jobId: "startup-cleanup" });
    await this.queue.add("cleanup", {}, {
      ...options,
      jobId: "hourly-cleanup",
      repeat: { every: 60 * 60 * 1000 }
    });
  }

  async process() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let deleted = 0;
    while (true) {
      const messages = await this.prisma.message.findMany({
        where: { createdAt: { lt: cutoff } },
        select: { id: true },
        take: 500
      });
      if (!messages.length) break;
      const ids = messages.map((message) => message.id);
      const count = await this.prisma.$transaction(async (tx) => {
        // Retain attachment metadata without referencing deleted messages.
        await tx.attachment.updateMany({
          where: { messageId: { in: ids } },
          data: { messageId: null }
        });
        return tx.message.deleteMany({ where: { id: { in: ids } } });
      });
      deleted += count.count;
    }
    this.logger.log(`Deleted ${deleted} messages older than ${cutoff.toISOString()}`);
    return { deleted };
  }
}
