import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class ProjectDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) @IsOptional() key?: string;
}

export class ProjectNameDto {
  @IsString() @MinLength(2) name!: string;
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
