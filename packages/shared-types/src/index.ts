export enum UserRole {
  ADMIN = "ADMIN",
  PROJECT_ADMIN = "PROJECT_ADMIN",
  PROJECT_AGENT = "PROJECT_AGENT"
}

export type Role = `${UserRole}`;

export const rolePermissions: Record<Role, { manageAllProjectSettings: boolean; manageProjectSettings: boolean }> = {
  [UserRole.ADMIN]: { manageAllProjectSettings: true, manageProjectSettings: true },
  [UserRole.PROJECT_ADMIN]: { manageAllProjectSettings: false, manageProjectSettings: true },
  [UserRole.PROJECT_AGENT]: { manageAllProjectSettings: false, manageProjectSettings: false }
};

export function canManageProjectSettings(globalRole?: Role, projectRole?: Role): boolean {
  return Boolean(
    (globalRole && rolePermissions[globalRole]?.manageAllProjectSettings) ||
    (projectRole && rolePermissions[projectRole]?.manageProjectSettings)
  );
}
export type ConversationStatus = "OPEN" | "PENDING" | "SNOOZED" | "RESOLVED";
export type AutomationMode = "AUTOMATED" | "HUMAN" | "AI";
export type SenderType = "CUSTOMER" | "AGENT" | "BOT" | "SYSTEM";
export type MessageStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED";
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
