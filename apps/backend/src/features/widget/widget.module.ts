import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service";
import { ProjectsModule } from "../projects/projects.module";
import { TicketsModule } from "../tickets/tickets.module";

import { WidgetService } from "./widget.service";
import { WidgetController } from "./widget.controller";

@Module({
  imports: [ProjectsModule, TicketsModule],
  controllers: [WidgetController],
  providers: [WidgetService, PrismaService]
})
export class WidgetModule {}
