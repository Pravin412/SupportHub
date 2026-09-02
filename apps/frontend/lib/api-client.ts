let API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
  API = `${window.location.protocol}//${window.location.hostname}:4000`;
}

let accessToken = "";
let refreshPromise: Promise<{ accessToken: string }> | null = null;

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
};

function isAuthEndpoint(path: string) {
  return path === "/auth/login" || path === "/auth/refresh" || path === "/auth/logout";
}

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = "";
}

async function fetchApi(path: string, init?: RequestInit) {
  const hasBody = Boolean(init?.body);
  try {
    return await fetch(`${API}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(hasBody ? { "content-type": "application/json" } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers
      }
    });
  } catch {
    throw new Error(`Cannot reach the API at ${API}. Make sure the backend is running.`);
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    const message = Array.isArray(error.message) ? error.message.join(", ") : error.message;
    throw new Error(message ?? "Request failed");
  }
  const json = (await res.json()) as ApiResponse<T> | T;
  if (json && typeof json === "object" && "data" in json && "success" in json) {
    return json.data;
  }
  return json as T;
}

export async function refreshAccessToken() {
  refreshPromise ??= fetchApi("/auth/refresh", { method: "POST", body: JSON.stringify({}) })
    .then((res) => parseResponse<{ accessToken: string }>(res))
    .then((data) => {
      accessToken = data.accessToken;
      return data;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function request<T>(path: string, init?: RequestInit, retryOnUnauthorized = true): Promise<T> {
  const res = await fetchApi(path, init);
  if (res.status === 401 && retryOnUnauthorized && !isAuthEndpoint(path)) {
    await refreshAccessToken();
    return request<T>(path, init, false);
  }
  return parseResponse<T>(res);
}
