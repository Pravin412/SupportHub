import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service";
import { ProjectsModule } from "../projects/projects.module";

import { TicketService } from "./ticket.service";
import { TicketController } from "./ticket.controller";

@Module({
  imports: [ProjectsModule],
  controllers: [TicketController],
  providers: [TicketService, PrismaService],
  exports: [TicketService]
})
export class TicketsModule {}
