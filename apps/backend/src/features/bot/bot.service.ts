import { Injectable } from "@nestjs/common";
import { AutomationMode } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { ProjectService } from "../project/project.service";

type BotConfigInput = {
  responseMode: AutomationMode;
  botName: string;
  fallbackMessage: string;
  botAvatar?: string;
};

const botSelect = {
  id: true,
  responseMode: true,
  botName: true,
  botAvatar: true,
  enabled: true,
  handoffKeywords: true,
  fallbackMessage: true
};

@Injectable()
export class BotService {
  constructor(
    private prisma: PrismaService,
    private projects: ProjectService
  ) {}

  async getConfig(userId: string, projectId: string) {
    await this.projects.assertMember(userId, projectId);
    return this.prisma.botConfiguration.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
      select: botSelect
    });
  }

  async updateConfig(userId: string, projectId: string, data: BotConfigInput) {
    await this.projects.assertProjectAdmin(userId, projectId);
    return this.prisma.botConfiguration.upsert({
      where: { projectId },
      update: data,
      create: { projectId, ...data },
      select: botSelect
    });
  }
}
