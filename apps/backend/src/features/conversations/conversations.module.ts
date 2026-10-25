import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PrismaService } from "../../common/database/prisma.service";
import { MessageRetentionProcessor } from "../../common/queue/message-retention.processor";
import { ProjectsModule } from "../projects/projects.module";
import { TicketsModule } from "../tickets/tickets.module";

import { ConversationService } from "./conversation.service";
import { ConversationController } from "./conversation.controller";

@Module({
  imports: [
    BullModule.registerQueue({ name: "message-retention" }),
    ProjectsModule,
    TicketsModule
  ],
  controllers: [ConversationController],
  providers: [ConversationService, MessageRetentionProcessor, PrismaService]
})
export class ConversationsModule {}
