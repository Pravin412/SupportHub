import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CoreService } from "./support.service";
import { WidgetDeliveryDto, WidgetMessageDto } from "./widget.dto";

@ApiTags("widget")
@Controller("widget/:channelId")
export class WidgetController {
  constructor(private core: CoreService) {}

  @Post("delivered")
  delivered(@Param("channelId") channelId: string, @Body() dto: WidgetDeliveryDto) {
    return this.core.widgetDelivered(channelId, dto.profileId, dto.messageIds);
  }

  @Get("config")
  config(@Param("channelId") channelId: string) {
    return this.core.widgetConfig(channelId);
  }

  @Get("messages")
  messages(@Param("channelId") channelId: string, @Query("profileId") profileId: string) {
    return this.core.widgetMessages(channelId, profileId);
  }

  @Post("messages")
  send(@Param("channelId") channelId: string, @Body() dto: WidgetMessageDto) {
    return this.core.widgetSendMessage(channelId, dto.profileId, dto.content, dto.name, dto.email, dto.number);
  }
}

