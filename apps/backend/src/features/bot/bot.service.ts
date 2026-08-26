import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service";
import { CoreService } from "../support/support.service";

type BotConfigInput = {
  responseMode: "AUTOMATED" | "HUMAN" | "AI";
  botName: string;
  fallbackMessage: string;
};

const botSelect = {
  id: true,
  responseMode: true,
  botName: true,
  enabled: true,
  handoffKeywords: true,
  fallbackMessage: true
};

@Injectable()
export class BotService {
  constructor(
    private db: PrismaService,
    private core: CoreService
  ) {}

  async getConfig(userId: string, projectId: string) {
    await this.core.assertMember(userId, projectId);
    return this.db.botConfiguration.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
      select: botSelect
    });
  }

  async updateConfig(userId: string, projectId: string, data: BotConfigInput) {
    await this.core.assertMember(userId, projectId);
    return this.db.botConfiguration.upsert({
      where: { projectId },
      update: data,
      create: { projectId, ...data },
      select: botSelect
    });
  }
}
