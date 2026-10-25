import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

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
