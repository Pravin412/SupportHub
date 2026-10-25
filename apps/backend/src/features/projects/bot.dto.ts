import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export enum BotResponseMode {
  AUTOMATED = "AUTOMATED",
  HUMAN = "HUMAN",
  AI = "AI"
}

export class BotConfigDto {
  @IsEnum(BotResponseMode) responseMode!: BotResponseMode;
  @IsString() @MinLength(2) botName!: string;
  @IsString() @MinLength(8) fallbackMessage!: string;
  @IsString() @IsOptional() botAvatar?: string;
}
