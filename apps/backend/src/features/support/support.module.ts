import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";
import { BotService } from "../bot/bot.service";
import { CoreController } from "./support.controller";
import { WidgetController } from "./widget.controller";
import { CoreService } from "./support.service";

@Module({
  imports: [BullModule.registerQueue({ name: "webhook" }, { name: "email" })],
  controllers: [CoreController, WidgetController],
  providers: [CoreService, BotService, PrismaService, CryptoService, QueueService, RealtimeGateway],
  exports: [CoreService]
})
export class SupportModule {}
