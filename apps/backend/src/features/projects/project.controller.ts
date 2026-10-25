import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ProjectDto, ProjectNameDto, WidgetSettingsDto } from "./project.dto";
import { ProjectService } from "../project/project.service";

@ApiTags("projects")
@ApiBearerAuth()
@Controller()
export class ProjectController {
  constructor(private projects: ProjectService) {}

  @Get("projects")
  list(@CurrentUser() userId: string) {
    return this.projects.projects(userId);
  }

  @Post("projects")
  create(@CurrentUser() userId: string, @Body() dto: ProjectDto) {
    return this.projects.createProject(userId, dto);
  }

  @Delete("projects/:id")
  remove(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.projects.deleteProject(userId, id);
  }

  @Put("projects/:id")
  rename(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: ProjectNameDto) {
    return this.projects.renameProject(userId, id, dto.name);
  }

  @Delete("projects/:id/contacts/:contactId")
  deleteContact(@CurrentUser() userId: string, @Param("id") id: string, @Param("contactId") contactId: string) {
    return this.projects.deleteContact(userId, id, contactId);
  }

  @Get("projects/:id/channels")
  channels(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.projects.channels(userId, id);
  }

  @Get("projects/:id/integration")
  integrationCredentials(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.projects.integrationCredentials(userId, id);
  }

  @Post("projects/:id/integration/rotate-secret")
  rotateIntegrationSecret(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.projects.rotateIntegrationSecret(userId, id);
  }

  @Put("projects/:id/widget")
  updateWidget(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: WidgetSettingsDto) {
    return this.projects.updateWidget(userId, id, dto);
  }
}
