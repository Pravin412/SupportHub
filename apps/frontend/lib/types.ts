export type ProjectDto = {
  id: string;
  name: string;
  key: string;
  widgetChannel?: { id: string; publicId: string; enabled: boolean } | null;
};

export type ChannelDto = {
  id: string;
  type: "WEBSITE_WIDGET";
  projectId: string;
  projectKey: string;
  publicId: string;
  name: string;
  enabled: boolean;
  websiteUrl?: string | null;
  welcomeMessage: string;
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
