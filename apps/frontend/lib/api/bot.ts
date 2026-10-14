import { request } from "../api-client";
import type { AutomationMode } from "@support-hub/shared-types";

type BotConfig = {
  responseMode: AutomationMode;
  botName: string;
  botAvatar?: string | null;
  enabled: boolean;
  fallbackMessage: string;
  handoffKeywords: string[];
};

export const botApi = {
  botConfig: (projectId: string) =>
    request<BotConfig>(`/projects/${projectId}/bot`),
  updateBotConfig: (
    projectId: string,
    data: { responseMode: AutomationMode; botName: string; fallbackMessage: string; botAvatar: string }
  ) => request<BotConfig>(`/projects/${projectId}/bot`, { method: "PUT", body: JSON.stringify(data) })
};
