export { widgetApi } from "./api/widget";

import { agentsApi } from "./api/agents";
import { authApi } from "./api/auth";
import { botApi } from "./api/bot";
import { channelsApi } from "./api/channels";
import { conversationsApi } from "./api/conversations";
import { dashboardApi } from "./api/dashboard";
import { projectsApi } from "./api/projects";
import { searchApi } from "./api/search";
import { settingsApi } from "./api/settings";
import { ticketsApi } from "./api/tickets";

export const api = {
  ...authApi,
  ...dashboardApi,
  ...searchApi,
  ...projectsApi,
  ...channelsApi,
  ...agentsApi,
  ...conversationsApi,
  ...ticketsApi,
  ...settingsApi,
  ...botApi
};
