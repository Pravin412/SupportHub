import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "@prisma/client";

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
