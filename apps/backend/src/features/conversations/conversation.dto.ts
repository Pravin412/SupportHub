import { IsEnum } from "class-validator";
import { ConversationStatus } from "@prisma/client";

export class ConversationStatusDto {
  @IsEnum(ConversationStatus) status!: ConversationStatus;
}
