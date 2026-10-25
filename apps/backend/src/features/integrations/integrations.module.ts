import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service";
import { IntegrationController } from "./integration.controller";
import { ProjectsModule } from "../projects/projects.module";
import { TicketsModule } from "../tickets/tickets.module";

@Module({
  imports: [ProjectsModule, TicketsModule],
  controllers: [IntegrationController],
  providers: [PrismaService]
})
export class IntegrationsModule {}

