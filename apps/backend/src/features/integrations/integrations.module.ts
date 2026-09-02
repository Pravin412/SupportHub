import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";
import { IntegrationController } from "./integration.controller";
import { SupportModule } from "../support/support.module";

@Module({
  imports: [BullModule.registerQueue({ name: "webhook" }, { name: "email" }), SupportModule],
  controllers: [IntegrationController],
  providers: [PrismaService, CryptoService, QueueService, RealtimeGateway]
})
export class IntegrationsModule {}

