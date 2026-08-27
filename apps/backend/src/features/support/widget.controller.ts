import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";
import { CoreService } from "./support.service";

class WidgetMessageDto {
  @IsString() @MinLength(1) profileId!: string;
  @IsString() @MinLength(1) content!: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() email?: string;
  @IsString() @IsOptional() number?: string;
}

@ApiTags("widget")
@Controller("widget/:channelId")
export class WidgetController {
  constructor(private core: CoreService) {}

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
