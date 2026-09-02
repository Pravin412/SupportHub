import type { MessageDto } from "@support-hub/shared-types";
import { request } from "../api-client";

export const widgetApi = {
  config: (channelId: string) => request<any>(`/widget/${channelId}/config?v=${Date.now()}`, { cache: "no-store" }),
  messages: (channelId: string, profileId: string) =>
    request<MessageDto[]>(`/widget/${channelId}/messages?profileId=${profileId}`),
  sendMessage: (channelId: string, profileId: string, content: string, name?: string, email?: string, number?: string) =>
    request<MessageDto>(`/widget/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ profileId, content, name, email, number })
    })
};
