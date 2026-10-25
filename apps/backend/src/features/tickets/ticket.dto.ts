import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { TicketPriority, TicketStatus } from "@prisma/client";

export class TicketDto {
  @IsString() @MinLength(3) title!: string;
  @IsEnum(TicketPriority) @IsOptional() priority: TicketPriority = "MEDIUM";
}

export class TicketStatusDto {
  @IsEnum(TicketStatus) status!: TicketStatus;
}
