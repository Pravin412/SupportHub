import { ArrayMaxSize, IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class WidgetMessageDto {
  @IsString() @MinLength(1) profileId!: string;
  @IsString() @MinLength(1) content!: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() email?: string;
  @IsString() @IsOptional() number?: string;
}

export class WidgetDeliveryDto {
  @IsString() @MinLength(1) profileId!: string;
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) messageIds!: string[];
}
