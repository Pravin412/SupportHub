import { Body, Controller, Headers, Param, Post, UnauthorizedException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";

class CustomerMessageDto {
  @IsString() externalUserId!: string;
  @IsString() @MinLength(1) content!: string;
  @IsString() @IsOptional() externalMessageId?: string;
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;
}

@ApiTags("integrations")
@Controller("integrations/:projectKey")
export class IntegrationController {
  constructor(
    private db: PrismaService,
    private crypto: CryptoService,
    private queues: QueueService,
    private realtime: RealtimeGateway
  ) {}

  @Post("messages")
  async message(
    @Param("projectKey") key: string,
    @Headers("x-integration-secret") secret: string,
    @Body() dto: CustomerMessageDto
  ) {
    const project = await this.db.project.findUnique({ where: { key } });
    if (
      !project ||
      project.integrationRevokedAt ||
      !(await this.crypto.compareSecret(secret ?? "", project.integrationSecretHash))
    )
      throw new UnauthorizedException();
    const contact = await this.db.contact.upsert({
      where: { projectId_externalUserId: { projectId: project.id, externalUserId: dto.externalUserId } },
      create: { projectId: project.id, externalUserId: dto.externalUserId, name: dto.name, email: dto.email },
      update: { name: dto.name, email: dto.email }
    });
    const conversation = await this.db.conversation
      .upsert({
        where: { id: dto.externalMessageId ?? "never-match" },
        create: { projectId: project.id, contactId: contact.id },
        update: {}
      })
      .catch(() => this.db.conversation.create({ data: { projectId: project.id, contactId: contact.id } }));
    const msg = await this.db.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "CUSTOMER",
        content: dto.content,
        externalMessageId: dto.externalMessageId
      }
    });
    await this.db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 }
      }
    });
    await this.queues.queueWebhook("message.created", project.id, msg);
    return { conversationId: conversation.id, messageId: msg.id };
  }

  @Post("conversations/:conversationId/messages")
  async botReply(
    @Param("projectKey") key: string,
    @Param("conversationId") conversationId: string,
    @Headers("x-integration-secret") secret: string,
    @Body() dto: { content: string; messageType?: string; senderType?: string; options?: Array<{ title: string; value: string }> }
  ) {
    const project = await this.db.project.findFirst({
      where: {
        OR: [{ key }, { id: key }]
      }
    });

    const conversation = await this.db.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new UnauthorizedException("Conversation not found");

    // Format content with options metadata if provided
    let contentToStore = dto.content;
    if (dto.options && Array.isArray(dto.options) && dto.options.length > 0) {
      contentToStore = JSON.stringify({
        text: dto.content,
        options: dto.options,
        isOptions: true
      });
    }

    const msg = await this.db.message.create({
      data: {
        conversationId,
        senderType: "BOT",
        content: contentToStore,
        status: "SENT"
      }
    });

    await this.db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Realtime notification to inbox & widget
    this.realtime.emitProject(conversation.projectId, "message.created", msg);
    this.realtime.emitConversation(conversationId, "message.created", msg);

    return {
      id: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      senderType: msg.senderType,
      createdAt: msg.createdAt
    };
  }

  @Post("events")
  event() {
    return { accepted: true };
  }
}
