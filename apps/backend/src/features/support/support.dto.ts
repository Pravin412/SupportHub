import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength, IsNumber } from "class-validator";
import { TicketPriority, TicketStatus, ConversationStatus, Role } from "@prisma/client";

export class TicketDto {
  @IsString() @MinLength(3) title!: string;
  @IsEnum(TicketPriority) @IsOptional() priority: TicketPriority = "MEDIUM";
}
export class ConversationStatusDto {
  @IsEnum(ConversationStatus) status!: ConversationStatus;
}
export class TicketStatusDto {
  @IsEnum(TicketStatus) status!: TicketStatus;
}
export class ProjectDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) @IsOptional() key?: string;
}
export class ProjectNameDto {
  @IsString() @MinLength(2) name!: string;
}
export class AgentContactDto {
  @IsString() @IsOptional() mobileNumber?: string;
  @IsBoolean() @IsOptional() whatsappNotificationsEnabled?: boolean;
}
export class AgentDto extends AgentContactDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(8) @IsOptional() password?: string;
  @IsEnum(Role) @IsOptional() role?: Role;
  @IsBoolean() @IsOptional() emailNotificationsEnabled?: boolean;
}
export class AgentPasswordDto {
  @IsString() @MinLength(8) password!: string;
}
export class AgentUpdateDto extends AgentContactDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) name!: string;
  @IsEnum(Role) role!: Role;
  @IsBoolean() emailNotificationsEnabled!: boolean;
}
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
export class WhatsappSettingsDto {
  @IsBoolean() @IsOptional() enabled?: boolean;
  @IsBoolean() @IsOptional() ticketCreatedEnabled?: boolean;
  @IsArray() @IsString({ each: true }) @IsOptional() recipientPhoneNumbers?: string[];
  @IsString() @IsOptional() ticketCreatedTemplateId?: string | null;
  @IsString() @IsOptional() providerUrl?: string | null;
  @IsString() @IsOptional() vendorId?: string | null;
  @IsString() @IsOptional() accessToken?: string | null;
}
export class TestWhatsappDto {
  @IsString() @IsOptional() phoneNumber?: string;
}
export class WhatsappTemplateDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) displayName!: string;
  @IsString() @IsOptional() language?: string;
  @IsString() @IsOptional() description?: string;
}
export class WidgetSettingsDto {
  @IsString() @IsOptional() welcomeMessage?: string;
  @IsString() @IsOptional() colorTheme?: string;
  @IsString() @IsOptional() logoUrl?: string;
  @IsBoolean() @IsOptional() collectVisitorInfo?: boolean;
  @IsBoolean() @IsOptional() visitorNameEnabled?: boolean;
  @IsBoolean() @IsOptional() visitorEmailEnabled?: boolean;
  @IsBoolean() @IsOptional() visitorPhoneEnabled?: boolean;
}
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
