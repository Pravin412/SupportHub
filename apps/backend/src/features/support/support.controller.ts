import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtService } from "@nestjs/jwt";
import { FastifyRequest } from "fastify";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { TicketPriority } from "@prisma/client";
import { BotService } from "../bot/bot.service";
import { CoreService } from "./support.service";

class MessageDto {
  @IsString() @MinLength(1) content!: string;
}
class TicketDto {
  @IsString() @MinLength(3) title!: string;
  @IsEnum(TicketPriority) @IsOptional() priority: TicketPriority = "MEDIUM";
}
class ProjectDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) @IsOptional() key?: string;
}
class AgentDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
}
class WebhookDto {
  @IsString() url!: string;
}
enum BotResponseMode {
  AUTOMATED = "AUTOMATED",
  HUMAN = "HUMAN",
  AI = "AI"
}
class BotConfigDto {
  @IsEnum(BotResponseMode) responseMode!: BotResponseMode;
  @IsString() @MinLength(2) botName!: string;
  @IsString() @MinLength(8) fallbackMessage!: string;
  @IsString() @IsOptional() botAvatar?: string;
}

@ApiTags("core")
@ApiBearerAuth()
@Controller()
export class CoreController {
  constructor(
    private core: CoreService,
    private bot: BotService,
    private jwt: JwtService
  ) {}

  @Get("projects")
  projects(@Req() req: FastifyRequest) {
    return this.core.projects(this.userId(req));
  }

  @Get("dashboard/summary")
  dashboardSummary(@Req() req: FastifyRequest) {
    return this.core.dashboardSummary(this.userId(req));
  }

  @Post("projects")
  createProject(@Req() req: FastifyRequest, @Body() dto: ProjectDto) {
    return this.core.createProject(this.userId(req), dto);
  }

  @Delete("projects/:id")
  deleteProject(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.deleteProject(this.userId(req), id);
  }

  @Get("projects/:id/channels")
  channels(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.channels(this.userId(req), id);
  }

  @Put("projects/:id/widget")
  updateWidget(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: { welcomeMessage?: string; colorTheme?: string; logoUrl?: string }) {
    return this.core.updateWidget(this.userId(req), id, dto);
  }

  @Get("projects/:id/agents")
  agents(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.agents(this.userId(req), id);
  }

  @Post("projects/:id/agents")
  createAgent(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: AgentDto) {
    return this.core.createAgent(this.userId(req), id, dto);
  }

  @Get("projects/:id/conversations")
  conversations(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Query("cursor") cursor?: string,
    @Query("search") search?: string
  ) {
    return this.core.conversations(this.userId(req), id, cursor, search);
  }

  @Get("conversations/:id/messages")
  messages(@Req() req: FastifyRequest, @Param("id") id: string, @Query("cursor") cursor?: string) {
    return this.core.messages(this.userId(req), id, cursor);
  }

  @Post("conversations/:id/messages")
  async send(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Body() dto: { content: string; messageType?: string; senderType?: string; options?: Array<{ title: string; value: string }> }
  ) {
    // If sent from external bot or integration (senderType is BOT)
    if (dto.senderType === "BOT") {
      let contentToStore = dto.content;
      if (dto.options && Array.isArray(dto.options) && dto.options.length > 0) {
        contentToStore = JSON.stringify({
          text: dto.content,
          options: dto.options,
          isOptions: true
        });
      }

      const conversation = await this.core["db"]?.conversation.findUnique({ where: { id } });
      if (!conversation) throw new Error("Conversation not found");

      const msg = await this.core["db"]?.message.create({
        data: {
          conversationId: id,
          senderType: "BOT",
          content: contentToStore,
          status: "SENT"
        }
      });

      await this.core["db"]?.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() }
      });

      this.core["realtime"]?.emitProject(conversation.projectId, "message.created", msg);
      this.core["realtime"]?.emitConversation(id, "message.created", msg);

      return msg;
    }

    return this.core.agentMessage(this.userId(req), id, dto.content);
  }

  @Post("conversations/:id/ticket")
  ticket(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: TicketDto) {
    return this.core.createTicket(this.userId(req), id, dto);
  }

  @Get("tickets")
  tickets(@Req() req: FastifyRequest, @Query("projectId") projectId?: string) {
    return this.core.tickets(this.userId(req), projectId);
  }

  @Get("projects/:id/webhook")
  webhook(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.webhook(this.userId(req), id);
  }

  @Put("projects/:id/webhook")
  updateWebhook(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: WebhookDto) {
    return this.core.updateWebhook(this.userId(req), id, dto);
  }

  @Get("projects/:id/bot")
  botConfig(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.bot.getConfig(this.userId(req), id);
  }

  @Put("projects/:id/bot")
  updateBotConfig(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: BotConfigDto) {
    return this.bot.updateConfig(this.userId(req), id, dto);
  }

  @Get("health")
  health() {
    return { ok: true, api: "up" };
  }

  private userId(req: FastifyRequest) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    return this.jwt.decode<{ sub: string }>(token ?? "")?.sub ?? "";
  }
}
