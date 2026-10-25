import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TestWhatsappDto, WhatsappSettingsDto, WhatsappTemplateDto } from "./whatsapp.dto";
import { SettingsService } from "../settings/settings.service";

@ApiTags("whatsapp")
@ApiBearerAuth()
@Controller()
export class ProjectWhatsappController {
  constructor(private settings: SettingsService) {}

  @Get("projects/:id/whatsapp-settings")
  whatsappSettings(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.settings.whatsappSettings(userId, id);
  }

  @Put("projects/:id/whatsapp-settings")
  updateWhatsappSettings(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: WhatsappSettingsDto) {
    return this.settings.updateWhatsappSettings(userId, id, dto);
  }

  @Post("projects/:id/whatsapp-settings/test")
  testWhatsappSettings(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: TestWhatsappDto) {
    return this.settings.testWhatsappSettings(userId, id, dto?.phoneNumber);
  }

  @Get("projects/:id/whatsapp-templates")
  whatsappTemplates(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.settings.whatsappTemplates(userId, id);
  }

  @Post("projects/:id/whatsapp-templates")
  createWhatsappTemplate(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: WhatsappTemplateDto) {
    return this.settings.createWhatsappTemplate(userId, id, dto);
  }

  @Put("projects/:id/whatsapp-templates/:templateId")
  updateWhatsappTemplate(@CurrentUser() userId: string, @Param("id") id: string, @Param("templateId") templateId: string, @Body() dto: WhatsappTemplateDto) {
    return this.settings.updateWhatsappTemplate(userId, id, templateId, dto);
  }

  @Delete("projects/:id/whatsapp-templates/:templateId")
  deleteWhatsappTemplate(@CurrentUser() userId: string, @Param("id") id: string, @Param("templateId") templateId: string) {
    return this.settings.deleteWhatsappTemplate(userId, id, templateId);
  }
}
