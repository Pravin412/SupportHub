import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { dashboardKeys } from "@/features/dashboard/queries";
import { ticketKeys } from "@/features/tickets/queries";

export const inboxKeys = {
  all: ["inbox"] as const,
  conversations: (projectId?: string, search = "") => [...inboxKeys.all, "conversations", projectId, search] as const,
  messages: (conversationId?: string) => [...inboxKeys.all, "messages", conversationId] as const
};

export function useConversations(projectId?: string, search = "") {
  return useQuery({
    queryKey: inboxKeys.conversations(projectId, search),
    queryFn: () => api.conversations(projectId!, search),
    enabled: Boolean(projectId)
  });
}

export function useMessages(id?: string) {
  return useQuery({ queryKey: inboxKeys.messages(id), queryFn: () => api.messages(id!), enabled: Boolean(id) });
}

export function useSendMessage(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.sendMessage(id!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inboxKeys.messages(id) });
      qc.invalidateQueries({ queryKey: inboxKeys.all });
    }
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "PENDING" | "SNOOZED" | "RESOLVED" }) =>
      api.updateConversationStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages(id) });
    }
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, contactId }: { projectId: string; contactId: string }) => api.deleteContact(projectId, contactId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: inboxKeys.conversations(variables.projectId) });
    }
  });
}
