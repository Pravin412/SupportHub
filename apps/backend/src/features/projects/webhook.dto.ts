import { IsBoolean, IsOptional, IsString } from "class-validator";

export class WebhookDto {
  @IsString() name!: string;
  @IsString() url!: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class UpdateWebhookDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() url?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
