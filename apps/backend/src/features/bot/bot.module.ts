import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service";
import { CoreService } from "../support/support.service";
import { BotService } from "./bot.service";

@Module({
  providers: [BotService, CoreService, PrismaService],
  exports: [BotService]
})
export class BotModule {}
