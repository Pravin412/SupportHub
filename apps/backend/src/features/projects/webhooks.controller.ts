import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UpdateWebhookDto, WebhookDto } from "./webhook.dto";
import { WebhookService } from "../webhooks/webhook.service";

@ApiTags("webhooks")
@ApiBearerAuth()
@Controller()
export class ProjectWebhooksController {
  constructor(private webhooks: WebhookService) {}

  @Get("projects/:id/webhooks")
  list(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.webhooks.webhooks(userId, id);
  }

  @Post("projects/:id/webhooks")
  create(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: WebhookDto) {
    return this.webhooks.createWebhook(userId, id, dto);
  }

  @Put("projects/:id/webhooks/:webhookId")
  update(@CurrentUser() userId: string, @Param("id") id: string, @Param("webhookId") webhookId: string, @Body() dto: UpdateWebhookDto) {
    return this.webhooks.updateWebhook(userId, id, webhookId, dto);
  }

  @Delete("projects/:id/webhooks/:webhookId")
  remove(@CurrentUser() userId: string, @Param("id") id: string, @Param("webhookId") webhookId: string) {
    return this.webhooks.deleteWebhook(userId, id, webhookId);
  }
}
