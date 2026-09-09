import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const
};

export function useMe(enabled = true) {
  return useQuery({ queryKey: authKeys.me(), queryFn: api.me, enabled });
}
