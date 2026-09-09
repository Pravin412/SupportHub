export enum TicketStatus {
  Open = "OPEN",
  InProgress = "IN_PROGRESS",
  Assigned = "ASSIGNED",
  Waiting = "WAITING",
  Resolved = "RESOLVED",
  Closed = "CLOSED"
}

export enum TicketStatusFilter {
  All = "ALL"
}

export type TicketStatusFilterValue = TicketStatusFilter.All | TicketStatus;

export const ticketStatusOptions: Array<{ value: TicketStatus; label: string }> = [
  { value: TicketStatus.Open, label: "Open" },
  { value: TicketStatus.InProgress, label: "In progress" },
  { value: TicketStatus.Assigned, label: "Assigned" },
  { value: TicketStatus.Waiting, label: "Waiting" },
  { value: TicketStatus.Resolved, label: "Resolved" },
  { value: TicketStatus.Closed, label: "Closed" }
];

export const ticketTabs: Array<{ value: TicketStatusFilterValue; label: string }> = [
  { value: TicketStatusFilter.All, label: "All" },
  ...ticketStatusOptions
];
