import { request } from "../api-client";
import type { ChannelDto } from "../types";

export const channelsApi = {
  channels: (projectId: string) => request<ChannelDto[]>(`/projects/${projectId}/channels`),
  updateWidget: (
    projectId: string,
    data: {
      welcomeMessage?: string;
      colorTheme?: string;
      logoUrl?: string;
      collectVisitorInfo?: boolean;
      visitorNameEnabled?: boolean;
      visitorEmailEnabled?: boolean;
      visitorPhoneEnabled?: boolean;
    }
  ) => request(`/projects/${projectId}/widget`, { method: "PUT", body: JSON.stringify(data) })
};
