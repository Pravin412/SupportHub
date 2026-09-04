import { clearAccessToken, refreshAccessToken, request, setAccessToken } from "../api-client";

export const authApi = {
  setToken: setAccessToken,
  login: async (email: string, password: string) => {
    const data = await request<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setAccessToken(data.accessToken);
    return data;
  },
  refresh: () => refreshAccessToken(),
  logout: async () => {
    const data = await request<{ ok: boolean }>("/auth/logout", { method: "POST" });
    clearAccessToken();
    return data;
  },
  me: () =>
    request<{
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "PROJECT_ADMIN" | "PROJECT_AGENT";
      memberships: Array<{ projectId: string; role: "ADMIN" | "PROJECT_ADMIN" | "PROJECT_AGENT" }>;
    }>("/auth/me")
};
