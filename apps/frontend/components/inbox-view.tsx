"use client";

import { useState, useEffect, useRef } from "react";
import { useInboxSelectionStore } from "../lib/inbox-selection-store";
import { useBotConfig, useConversations, useMessages, useProjects, useSendMessage, keys } from "../lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { Socket } from "socket.io-client";
import { connectRealtime } from "../lib/realtime-client";
import { ClientEvent } from "../lib/events";
import { inboxKeys } from "../features/inbox/queries";
import { InboxProjectsList, InboxConversationsList } from "./inbox-lists";
import { InboxChatView } from "./inbox-chat-view";
import { InboxEmptyState } from "./inbox-empty-state";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function InboxView() {
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const inboxSelection = useInboxSelectionStore();
  const queryClient = useQueryClient();
  const projects = useProjects(true);

  const selectedProjectId = inboxSelection.selectedProjectId;
  const selectedProject = projects.data?.find((project) => project.id === selectedProjectId);

  const conversations = useConversations(selectedProjectId, debouncedSearch);
  const botConfig = useBotConfig(selectedProjectId);

  const activeConversation =
    conversations.data?.find((conversation) => conversation.id === inboxSelection.selectedConversationId) ??
    (inboxSelection.selectedConversationId ? undefined : conversations.data?.[0]);
  const activeId = activeConversation?.id;

  const messages = useMessages(activeId);
  const send = useSendMessage(activeId);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = connectRealtime(API_URL);
    socket.on("connect", function subscribeAfterConnect() {
      if (selectedProjectId) socket.emit("project:subscribe", selectedProjectId);
      if (activeId) socket.emit("conversation:subscribe", activeId);
    });
    socketRef.current = socket;

    socket.on(ClientEvent.MessageCreated, (newMsg) => {
      if (newMsg.conversationId) {
        queryClient.invalidateQueries({ queryKey: keys.messages(newMsg.conversationId) });
      }
      if (selectedProjectId) {
        queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, "conversations", selectedProjectId] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedProjectId, activeId, queryClient]);

  const sendDraft = () => {
    const content = draft.trim();
    if (!content || send.isPending || !activeId) return;
    send.mutate(content, { onSuccess: () => setDraft("") });
  };

  return (
    <div className="flex h-main md:grid md:grid-cols-inbox">
      {/* Left Sidebar: Projects List OR Contacts List */}
      <section className={`h-full flex-col border-r border-border bg-white w-full md:w-auto ${inboxSelection.selectedConversationId ? "hidden md:flex" : "flex"}`}>
        {!selectedProjectId ? (
          <InboxProjectsList
            projects={projects}
            onSelectProject={(id) => {
              inboxSelection.setProject(id);
              setSearchQuery("");
            }}
          />
        ) : (
          <InboxConversationsList
            projectName={selectedProject?.name}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onBack={() => inboxSelection.setProject("")}
            conversations={conversations}
            activeId={activeId}
            onSelectConversation={(id) => inboxSelection.setConversation(id)}
          />
        )}
      </section>

      {/* Right Section: Active Chat View */}
      <section className={`min-h-0 flex-col bg-chat-pane w-full md:w-auto ${inboxSelection.selectedConversationId ? "flex" : "hidden md:flex"}`}>
        {activeId ? (
          <InboxChatView
            activeConversation={activeConversation}
            selectedProject={selectedProject}
            botName={botConfig.data?.botName}
            messages={messages}
            draft={draft}
            onDraftChange={setDraft}
            onSend={sendDraft}
            isSending={send.isPending}
          />
        ) : (
          <InboxEmptyState selectedProjectId={selectedProjectId} />
        )}
      </section>
    </div>
  );
}
