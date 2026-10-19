import { ConversationStatus } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CustomerMessageDto {
  @IsString() externalUserId!: string;
  @IsString() @MinLength(1) content!: string;
  @IsString() @IsOptional() externalMessageId?: string;
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() number?: string;
  @IsEnum(ConversationStatus) @IsOptional() status?: ConversationStatus;
  @IsString() @IsOptional() assignedTo?: "human";
}

export class ConversationStatusDto {
  @IsEnum(ConversationStatus) status!: ConversationStatus;
  @IsString() @IsOptional() assignedTo?: "human";
}
