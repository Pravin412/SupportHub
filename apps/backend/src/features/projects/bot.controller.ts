import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { BotConfigDto } from "./bot.dto";
import { BotService } from "../bot/bot.service";

@ApiTags("bot")
@ApiBearerAuth()
@Controller()
export class ProjectBotController {
  constructor(private bot: BotService) {}

  @Get("projects/:id/bot")
  getConfig(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.bot.getConfig(userId, id);
  }

  @Put("projects/:id/bot")
  updateConfig(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: BotConfigDto) {
    return this.bot.updateConfig(userId, id, dto);
  }
}
