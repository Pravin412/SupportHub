import { request } from "../api-client";

export const searchApi = {
  search: (query: string) => request<any>(`/search?query=${encodeURIComponent(query)}`)
};
