import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ConversationStatusDto } from "./conversation.dto";
import { TicketDto } from "../tickets/ticket.dto";
import { ConversationService } from "./conversation.service";
import { TicketService } from "../tickets/ticket.service";

@ApiTags("conversations")
@ApiBearerAuth()
@Controller()
export class ConversationController {
  constructor(
    private conversations: ConversationService,
    private tickets: TicketService
  ) {}

  @Get("projects/:id/conversations")
  list(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Query("cursor") cursor?: string,
    @Query("search") search?: string
  ) {
    return this.conversations.conversations(userId, id, cursor, search);
  }

  @Put("conversations/:id/status")
  updateStatus(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: ConversationStatusDto) {
    return this.conversations.updateConversationStatus(userId, id, dto.status);
  }

  @Get("conversations/:id/messages")
  messages(@CurrentUser() userId: string, @Param("id") id: string, @Query("cursor") cursor?: string) {
    return this.conversations.messages(userId, id, cursor);
  }

  @Post("conversations/:id/messages")
  send(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Body() dto: { content: string }
  ) {
    return this.conversations.agentMessage(userId, id, dto.content);
  }

  @Post("conversations/:id/ticket")
  createTicket(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: TicketDto) {
    return this.tickets.createTicket(userId, id, dto);
  }
}
