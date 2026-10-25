import { Body, Controller, Get, Param, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TicketStatusDto } from "./ticket.dto";
import { TicketService } from "./ticket.service";

@ApiTags("tickets")
@ApiBearerAuth()
@Controller()
export class TicketController {
  constructor(private tickets: TicketService) {}

  @Get("tickets")
  list(@CurrentUser() userId: string, @Query("projectId") projectId?: string, @Query("search") search?: string) {
    return this.tickets.tickets(userId, projectId, search);
  }

  @Put("tickets/:id/status")
  updateStatus(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: TicketStatusDto) {
    return this.tickets.updateTicketStatus(userId, id, dto.status);
  }
}
