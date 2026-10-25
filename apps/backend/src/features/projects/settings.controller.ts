import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { EmailSettingsDto, NotificationSettingsDto } from "./settings.dto";
import { SettingsService } from "../settings/settings.service";

@ApiTags("settings")
@ApiBearerAuth()
@Controller()
export class ProjectSettingsController {
  constructor(private settings: SettingsService) {}

  @Get("projects/:id/notifications")
  notificationSettings(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.settings.notificationSettings(userId, id);
  }

  @Put("projects/:id/notifications")
  updateNotificationSettings(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: NotificationSettingsDto) {
    return this.settings.updateNotificationSettings(userId, id, dto);
  }

  @Get("projects/:id/email-settings")
  emailSettings(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.settings.emailSettings(userId, id);
  }

  @Put("projects/:id/email-settings")
  updateEmailSettings(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: EmailSettingsDto) {
    return this.settings.updateEmailSettings(userId, id, dto);
  }

  @Post("projects/:id/email-settings/test")
  testEmailSettings(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.settings.testEmailSettings(userId, id);
  }
}
