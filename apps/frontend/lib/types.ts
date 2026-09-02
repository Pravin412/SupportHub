export type ProjectDto = {
  id: string;
  name: string;
  key: string;
  widgetChannel?: { id: string; channelId: string; enabled: boolean } | null;
};

export type ChannelDto = {
  id: string;
  type: "WEBSITE_WIDGET";
  projectId: string;
  projectKey: string;
  channelId: string;
  name: string;
  enabled: boolean;
  websiteUrl?: string | null;
  welcomeMessage: string;
  colorTheme?: string;
  logoUrl?: string | null;
  collectVisitorInfo: boolean;
  visitorNameEnabled: boolean;
  visitorEmailEnabled: boolean;
  visitorPhoneEnabled: boolean;
  launcherPosition: string;
  createdAt: string;
};

export type DashboardSummaryDto = {
  projectsCount: number;
  conversationsCount: number;
  openConversationsCount: number;
  unreadConversationsCount: number;
  ticketsCount: number;
  openTicketsCount: number;
  agentsCount: number;
  activeChannelsCount: number;
};

export type DashboardRange = "today" | "week" | "month" | "all";
