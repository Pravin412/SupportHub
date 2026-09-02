import { request } from "../api-client";

export const botApi = {
  botConfig: (projectId: string) =>
    request<{
      responseMode: "AUTOMATED" | "HUMAN" | "AI";
      botName: string;
      botAvatar?: string | null;
      enabled: boolean;
      fallbackMessage: string;
      handoffKeywords: string[];
    }>(`/projects/${projectId}/bot`),
  updateBotConfig: (
    projectId: string,
    data: { responseMode: "AUTOMATED" | "HUMAN" | "AI"; botName: string; fallbackMessage: string; botAvatar?: string }
  ) => request(`/projects/${projectId}/bot`, { method: "PUT", body: JSON.stringify(data) })
};
