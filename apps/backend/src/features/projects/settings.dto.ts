import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class NotificationSettingsDto {
  @IsString() notificationEmail!: string;
  @IsBoolean() @IsOptional() ticketCreatedEnabled?: boolean;
  @IsBoolean() @IsOptional() ticketAssignedEnabled?: boolean;
  @IsBoolean() @IsOptional() conversationAssignedEnabled?: boolean;
  @IsBoolean() @IsOptional() messageReceivedEnabled?: boolean;
}

export class EmailSettingsDto {
  @IsString() smtpHost!: string;
  @IsNumber() smtpPort!: number;
  @IsBoolean() smtpSecure!: boolean;
  @IsString() smtpUser!: string;
  @IsString() @IsOptional() smtpPassword?: string;
  @IsString() @IsOptional() fromName?: string;
}
