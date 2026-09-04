import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UnauthorizedException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtService } from "@nestjs/jwt";
import { FastifyRequest } from "fastify";
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength, IsNumber } from "class-validator";
import { TicketPriority, TicketStatus, ConversationStatus, Role } from "@prisma/client";
import { BotService } from "../bot/bot.service";
import { CoreService } from "./support.service";

class TicketDto {
  @IsString() @MinLength(3) title!: string;
  @IsEnum(TicketPriority) @IsOptional() priority: TicketPriority = "MEDIUM";
}
class ConversationStatusDto {
  @IsEnum(ConversationStatus) status!: ConversationStatus;
}
class TicketStatusDto {
  @IsEnum(TicketStatus) status!: TicketStatus;
}
class ProjectDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) @IsOptional() key?: string;
}
class AgentDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(8) @IsOptional() password?: string;
  @IsEnum(Role) @IsOptional() role?: Role;
}
class AgentPasswordDto {
  @IsString() @MinLength(8) password!: string;
}
class WebhookDto {
  @IsString() name!: string;
  @IsString() url!: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
class NotificationSettingsDto {
  @IsString() notificationEmail!: string;
  @IsBoolean() @IsOptional() ticketCreatedEnabled?: boolean;
  @IsBoolean() @IsOptional() ticketAssignedEnabled?: boolean;
  @IsBoolean() @IsOptional() conversationAssignedEnabled?: boolean;
  @IsBoolean() @IsOptional() messageReceivedEnabled?: boolean;
}
class EmailSettingsDto {
  @IsString() smtpHost!: string;
  @IsNumber() smtpPort!: number;
  @IsBoolean() smtpSecure!: boolean;
  @IsString() smtpUser!: string;
  @IsString() @IsOptional() smtpPassword?: string;
  @IsString() @IsOptional() fromName?: string;
}
class WidgetSettingsDto {
  @IsString() @IsOptional() welcomeMessage?: string;
  @IsString() @IsOptional() colorTheme?: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsBoolean() @IsOptional() collectVisitorInfo?: boolean;
  @IsBoolean() @IsOptional() visitorNameEnabled?: boolean;
  @IsBoolean() @IsOptional() visitorEmailEnabled?: boolean;
  @IsBoolean() @IsOptional() visitorPhoneEnabled?: boolean;
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
  async projects(@Req() req: FastifyRequest) {
    return this.core.projects(await this.userId(req));
  }

  @Get("search")
  async search(@Req() req: FastifyRequest, @Query("query") query?: string) {
    return this.core.globalSearch(await this.userId(req), query ?? "");
  }

  @Get("dashboard/summary")
  async dashboardSummary(@Req() req: FastifyRequest, @Query("range") range?: "today" | "week" | "month" | "all") {
    return this.core.dashboardSummary(await this.userId(req), range);
  }

  @Post("projects")
  async createProject(@Req() req: FastifyRequest, @Body() dto: ProjectDto) {
    return this.core.createProject(await this.userId(req), dto);
  }

  @Delete("projects/:id")
  async deleteProject(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.deleteProject(await this.userId(req), id);
  }

  @Delete("projects/:id/contacts/:contactId")
  async deleteContact(@Req() req: FastifyRequest, @Param("id") id: string, @Param("contactId") contactId: string) {
    return this.core.deleteContact(await this.userId(req), id, contactId);
  }

  @Get("projects/:id/channels")
  async channels(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.channels(await this.userId(req), id);
  }

  @Get("projects/:id/integration")
  async integrationCredentials(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.integrationCredentials(await this.userId(req), id);
  }

  @Post("projects/:id/integration/rotate-secret")
  async rotateIntegrationSecret(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.rotateIntegrationSecret(await this.userId(req), id);
  }

  @Put("projects/:id/widget")
  async updateWidget(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: WidgetSettingsDto) {
    return this.core.updateWidget(await this.userId(req), id, dto);
  }

  @Get("projects/:id/agents")
  async agents(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.agents(await this.userId(req), id);
  }

  @Get("projects/:id/agents/lookup")
  async lookupAgent(@Req() req: FastifyRequest, @Param("id") id: string, @Query("email") email?: string) {
    return this.core.lookupAgent(await this.userId(req), id, email ?? "");
  }

  @Post("projects/:id/agents")
  async createAgent(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: AgentDto) {
    return this.core.createAgent(await this.userId(req), id, dto);
  }

  @Put("projects/:id/agents/:memberId/password")
  async updateAgentPassword(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Body() dto: AgentPasswordDto
  ) {
    return this.core.updateAgentPassword(await this.userId(req), id, memberId, dto.password);
  }

  @Delete("projects/:id/agents/:memberId")
  async removeAgent(@Req() req: FastifyRequest, @Param("id") id: string, @Param("memberId") memberId: string) {
    return this.core.removeAgent(await this.userId(req), id, memberId);
  }

  @Get("projects/:id/conversations")
  async conversations(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Query("cursor") cursor?: string,
    @Query("search") search?: string
  ) {
    return this.core.conversations(await this.userId(req), id, cursor, search);
  }

  @Put("conversations/:id/status")
  async updateConversationStatus(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: ConversationStatusDto) {
    return this.core.updateConversationStatus(await this.userId(req), id, dto.status);
  }

  @Get("conversations/:id/messages")
  async messages(@Req() req: FastifyRequest, @Param("id") id: string, @Query("cursor") cursor?: string) {
    return this.core.messages(await this.userId(req), id, cursor);
  }

  @Post("conversations/:id/messages")
  async send(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Body() dto: { content: string; messageType?: string; senderType?: string; options?: Array<{ title: string; value: string }> }
  ) {
    return this.core.agentMessage(await this.userId(req), id, dto.content);
  }

  @Post("conversations/:id/ticket")
  async ticket(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: TicketDto) {
    return this.core.createTicket(await this.userId(req), id, dto);
  }

  @Get("tickets")
  async tickets(@Req() req: FastifyRequest, @Query("projectId") projectId?: string) {
    return this.core.tickets(await this.userId(req), projectId);
  }

  @Put("tickets/:id/status")
  async updateTicketStatus(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: TicketStatusDto) {
    return this.core.updateTicketStatus(await this.userId(req), id, dto.status);
  }

  @Get("projects/:id/webhooks")
  async webhooks(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.webhooks(await this.userId(req), id);
  }

  @Post("projects/:id/webhooks")
  async createWebhook(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: WebhookDto) {
    return this.core.createWebhook(await this.userId(req), id, dto);
  }

  @Put("projects/:id/webhooks/:webhookId")
  async updateWebhook(@Req() req: FastifyRequest, @Param("id") id: string, @Param("webhookId") webhookId: string, @Body() dto: WebhookDto) {
    return this.core.updateWebhook(await this.userId(req), id, webhookId, dto);
  }

  @Delete("projects/:id/webhooks/:webhookId")
  async deleteWebhook(@Req() req: FastifyRequest, @Param("id") id: string, @Param("webhookId") webhookId: string) {
    return this.core.deleteWebhook(await this.userId(req), id, webhookId);
  }

  @Get("projects/:id/notifications")
  async notificationSettings(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.notificationSettings(await this.userId(req), id);
  }

  @Put("projects/:id/notifications")
  async updateNotificationSettings(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: NotificationSettingsDto) {
    return this.core.updateNotificationSettings(await this.userId(req), id, dto);
  }

  @Get("projects/:id/email-settings")
  async emailSettings(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.emailSettings(await this.userId(req), id);
  }

  @Put("projects/:id/email-settings")
  async updateEmailSettings(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: EmailSettingsDto) {
    return this.core.updateEmailSettings(await this.userId(req), id, dto);
  }

  @Post("projects/:id/email-settings/test")
  async testEmailSettings(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.core.testEmailSettings(await this.userId(req), id);
  }

  @Get("projects/:id/bot")
  async botConfig(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.bot.getConfig(await this.userId(req), id);
  }

  @Put("projects/:id/bot")
  async updateBotConfig(@Req() req: FastifyRequest, @Param("id") id: string, @Body() dto: BotConfigDto) {
    return this.bot.updateConfig(await this.userId(req), id, dto);
  }

  @Get("health")
  health() {
    return { ok: true, api: "up" };
  }

  private async userId(req: FastifyRequest) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException();
    return (await this.jwt.verifyAsync<{ sub: string }>(token, { secret: process.env.JWT_ACCESS_SECRET })).sub;
  }
}
