import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PrismaService } from "../../common/database/prisma.service";
import { CryptoService } from "../../common/crypto/crypto.service";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";
import { WhatsappService } from "../../common/whatsapp/whatsapp.service";
import { BotService } from "../bot/bot.service";

import { ProjectService } from "../project/project.service";
import { AgentService } from "../agents/agent.service";
import { WebhookService } from "../webhooks/webhook.service";
import { SettingsService } from "../settings/settings.service";

import { DashboardController } from "../dashboard/dashboard.controller";
import { ProjectController } from "./project.controller";
import { AgentsController } from "./agents.controller";
import { ProjectSettingsController } from "./settings.controller";
import { ProjectWhatsappController } from "./whatsapp.controller";
import { ProjectWebhooksController } from "./webhooks.controller";
import { ProjectBotController } from "./bot.controller";

@Module({
  imports: [BullModule.registerQueue({ name: "webhook" }, { name: "email" })],
  controllers: [
    DashboardController,
    ProjectController,
    AgentsController,
    ProjectSettingsController,
    ProjectWhatsappController,
    ProjectWebhooksController,
    ProjectBotController
  ],
  providers: [
    ProjectService, AgentService, WebhookService, SettingsService, BotService,
    PrismaService, CryptoService, QueueService, RealtimeGateway, WhatsappService
  ],
  exports: [ProjectService, CryptoService, QueueService, RealtimeGateway, WhatsappService]
})
export class ProjectsModule {}
