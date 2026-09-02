import { Body, Controller, Headers, Param, Post, UnauthorizedException } from "@nestjs/common";
import { ConversationStatus } from "@prisma/client";
import { ApiTags } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { CoreService } from "../support/support.service";

import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";
import { SupportEvent } from "../../common/events/support-events";
import { QueueService } from "../../common/queue/queue.service";
import { RealtimeGateway } from "../../common/realtime/realtime.gateway";

class CustomerMessageDto {
  @IsString() externalUserId!: string;
  @IsString() @MinLength(1) content!: string;
  @IsString() @IsOptional() externalMessageId?: string;
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() number?: string;
  @IsEnum(ConversationStatus) @IsOptional() status?: ConversationStatus;
  @IsString() @IsOptional() assignedTo?: "human";
}

class ConversationStatusDto {
  @IsEnum(ConversationStatus) status!: ConversationStatus;
  @IsString() @IsOptional() assignedTo?: "human";
}

@ApiTags("integrations")
@Controller("integrations/:projectKey")
export class IntegrationController {
    constructor(
    private db: PrismaService,
    private crypto: CryptoService,
    private queues: QueueService,
    private realtime: RealtimeGateway,
    private core: CoreService
  ) {}

  @Post("messages")
  async message(
    @Param("projectKey") key: string,
    @Headers("x-integration-secret") secret: string,
    @Body() dto: any
  ) {
    console.log("=== INCOMING POST /messages ===");
    console.log("Project Key:", key);
    console.log("Payload:", JSON.stringify(dto, null, 2));
    
    const project = await this.authorizeProject(key, secret);
    const contact = await this.db.contact.upsert({
      where: { projectId_externalUserId: { projectId: project.id, externalUserId: dto.externalUserId } },
      create: {
        projectId: project.id,
        externalUserId: dto.externalUserId,
        name: dto.name,
        email: dto.email,
        phone: dto.number
      },
      update: { name: dto.name, email: dto.email, phone: dto.number }
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
    const updated = await this.db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.assignedTo === "human" ? { automationMode: "HUMAN" } : {})
      }
    });

    await this.queues.queueWebhook(SupportEvent.MessageCreated, project.id, msg);

    if (dto.assignedTo === "human" || dto.status) {
      this.realtime.emitProject(project.id, SupportEvent.ConversationAssigned, updated);
      if (dto.status === "OPEN") {
        const existingOpenTicket = await this.db.ticket.findFirst({
          where: {
            conversationId: conversation.id,
            status: { notIn: ["RESOLVED", "CLOSED"] }
          }
        });
        if (!existingOpenTicket) {
          const ticket = await this.db.ticket.create({
            data: {
              projectId: project.id,
              conversationId: conversation.id,
              contactId: updated.contactId,
              title: "Escalated by External Bot",
              priority: "MEDIUM"
            }
          });
          this.realtime.emitProject(project.id, SupportEvent.TicketCreated, ticket);
          await this.core.queueTicketEmail(project.id, "created", ticket);
        }
      }
    }

    return { conversationId: conversation.id, messageId: msg.id };
  }

  @Post("conversations/:conversationId/messages")
  async botReply(
    @Param("projectKey") key: string,
    @Param("conversationId") conversationId: string,
    @Headers("x-integration-secret") secret: string,
    @Body() dto: any
  ) {
    console.log("=== INCOMING POST botReply ===");
    console.log("Project Key:", key);
    console.log("Conversation ID:", conversationId);
    console.log("Payload:", JSON.stringify(dto, null, 2));

    const project = await this.authorizeProject(key, secret);

    const conversation = await this.db.conversation.findFirst({ where: { id: conversationId, projectId: project.id } });
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

    const updated = await this.db.conversation.update({
      where: { id: conversationId },
      data: { 
        lastMessageAt: new Date(),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.assignedTo === "human" ? { automationMode: "HUMAN" } : {})
      },
      select: { id: true, projectId: true, status: true, automationMode: true, updatedAt: true, contactId: true }
    });

    this.realtime.emitProject(conversation.projectId, SupportEvent.MessageCreated, msg);
    this.realtime.emitConversation(conversationId, SupportEvent.MessageCreated, msg);

    if (dto.assignedTo === "human" || dto.status) {
      this.realtime.emitProject(project.id, SupportEvent.ConversationAssigned, updated);
      if (dto.status === "OPEN") {
        const existingOpenTicket = await this.db.ticket.findFirst({
          where: {
            conversationId: conversation.id,
            status: { notIn: ["RESOLVED", "CLOSED"] }
          }
        });
        if (!existingOpenTicket) {
          const ticket = await this.db.ticket.create({
            data: {
              projectId: project.id,
              conversationId: conversation.id,
              contactId: updated.contactId,
              title: "Escalated by External Bot",
              priority: "MEDIUM"
            }
          });
          this.realtime.emitProject(project.id, SupportEvent.TicketCreated, ticket);
          await this.core.queueTicketEmail(project.id, "created", ticket);
        }
      }
    }

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

  private async authorizeProject(key: string, secret: string) {
    const project = await this.db.project.findFirst({
      where: {
        OR: [{ key }, { integrationKey: key }, { id: key }]
      }
    });
    const integrationSecret = (project as { integrationSecret?: string | null } | null)?.integrationSecret;
    if (
      !project ||
      project.integrationRevokedAt ||
      !(await this.matchesIntegrationSecret(secret ?? "", integrationSecret, project.integrationSecretHash))
    ) {
      throw new UnauthorizedException();
    }
    return project;
  }

  private async matchesIntegrationSecret(secret: string, storedSecret?: string | null, storedHash?: string | null) {
    if (storedSecret && this.crypto.safeEqual(secret, storedSecret)) return true;
    if (storedHash && (await this.crypto.compareSecret(secret, storedHash))) return true;
    return false;
  }
}

