import {
  authKeys,
  dashboardKeys,
  inboxKeys,
  projectKeys,
  searchKeys,
  settingsKeys,
  ticketKeys
} from "@/features/queries";

export const keys = {
  me: authKeys.me(),
  dashboardSummary: dashboardKeys.summary,
  projects: projectKeys.list(),
  agents: settingsKeys.agents,
  conversations: inboxKeys.conversations,
  messages: inboxKeys.messages,
  tickets: ticketKeys.list,
  channels: settingsKeys.channels,
  integrationCredentials: projectKeys.integrationCredentials,
  webhook: settingsKeys.webhook,
  notificationSettings: settingsKeys.notificationSettings,
  emailSettings: settingsKeys.emailSettings,
  botConfig: settingsKeys.botConfig,
  globalSearch: searchKeys.global
};

export * from "@/features/queries";
