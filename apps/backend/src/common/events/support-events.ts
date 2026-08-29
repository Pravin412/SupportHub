export enum SupportEvent {
  MessageCreated = "message.created",
  TicketCreated = "ticket.created",
  ConversationAssigned = "conversation.assigned"
}

export enum ExternalWebhookEvent {
  MessageCreated = "message_created"
}

export enum WebhookMessageType {
  Incoming = "incoming",
  Outgoing = "outgoing"
}

export enum WebhookSenderType {
  Contact = "contact",
  Agent = "agent"
}
