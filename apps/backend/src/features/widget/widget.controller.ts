import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SkipAuth } from "../../common/decorators/skip-auth.decorator";
import { WidgetService } from "./widget.service";
import { WidgetDeliveryDto, WidgetMessageDto } from "./widget.dto";

@SkipAuth()
@ApiTags("widget")
@Controller("widget/:channelId")
export class WidgetController {
  constructor(private widget: WidgetService) {}

  @Post("delivered")
  delivered(@Param("channelId") channelId: string, @Body() dto: WidgetDeliveryDto) {
    return this.widget.widgetDelivered(channelId, dto.profileId, dto.messageIds);
  }

  @Get("config")
  config(@Param("channelId") channelId: string) {
    return this.widget.widgetConfig(channelId);
  }

  @Get("messages")
  messages(@Param("channelId") channelId: string, @Query("profileId") profileId: string) {
    return this.widget.widgetMessages(channelId, profileId);
  }

  @Post("messages")
  send(@Param("channelId") channelId: string, @Body() dto: WidgetMessageDto) {
    return this.widget.widgetSendMessage(channelId, dto.profileId, dto.content, dto.name, dto.email, dto.number);
  }
}
