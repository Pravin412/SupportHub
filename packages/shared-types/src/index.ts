export type Role = "ADMIN" | "PROJECT_ADMIN" | "PROJECT_AGENT";
export type ConversationStatus = "OPEN" | "PENDING" | "SNOOZED" | "RESOLVED";
export type AutomationMode = "AUTOMATED" | "HUMAN" | "AI";
export type SenderType = "CUSTOMER" | "AGENT" | "BOT" | "SYSTEM";
export type MessageStatus = "PENDING" | "SENT" | "FAILED";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type CursorPage<T> = { items: T[]; nextCursor?: string };
export type ConversationSummary = {
  id: string;
  projectId: string;
  contactName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  externalUserId?: string | null;
  status: ConversationStatus;
  automationMode: AutomationMode;
  unreadCount: number;
  lastMessageAt: string;
  preview: string;
};
export type MessageDto = {
  id: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  status: MessageStatus;
  createdAt: string;
};
