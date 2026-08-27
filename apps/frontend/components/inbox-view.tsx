"use client";

import { useState, useEffect, useRef } from "react";
import { useUiStore } from "../lib/store";
import { useConversations, useMessages, useProjects, useSendMessage, keys } from "../lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { InboxProjectsList, InboxConversationsList } from "./inbox-lists";
import { InboxChatView, InboxEmptyState } from "./inbox-chat-view";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function InboxView() {
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const ui = useUiStore();
  const queryClient = useQueryClient();
  const projects = useProjects(true);

  const selectedProjectId = ui.selectedProjectId;
  const selectedProject = projects.data?.find((p) => p.id === selectedProjectId);

  const conversations = useConversations(selectedProjectId, searchQuery);

  const activeConversation =
    conversations.data?.find((c) => c.id === ui.selectedConversationId) ??
    (ui.selectedConversationId ? undefined : conversations.data?.[0]);
  const activeId = activeConversation?.id;

  const messages = useMessages(activeId);
  const send = useSendMessage(activeId);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true
    });
    socketRef.current = socket;

    if (selectedProjectId) socket.emit("project:subscribe", selectedProjectId);
    if (activeId) socket.emit("conversation:subscribe", activeId);

    socket.on("message.created", (newMsg) => {
      if (newMsg.conversationId) {
        queryClient.invalidateQueries({ queryKey: keys.messages(newMsg.conversationId) });
      }
      if (selectedProjectId) {
        queryClient.invalidateQueries({ queryKey: keys.conversations(selectedProjectId, searchQuery) });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedProjectId, activeId, searchQuery, queryClient]);

  const sendDraft = () => {
    const content = draft.trim();
    if (!content || send.isPending || !activeId) return;
    send.mutate(content, { onSuccess: () => setDraft("") });
  };

  return (
    <div className="grid h-main md:grid-cols-inbox">
      {/* Left Sidebar: Projects List OR Contacts List */}
      <section className="flex h-full flex-col border-r border-border bg-white">
        {!selectedProjectId ? (
          <InboxProjectsList
            projects={projects}
            onSelectProject={(id) => {
              ui.setProject(id);
              setSearchQuery("");
            }}
          />
        ) : (
          <InboxConversationsList
            projectName={selectedProject?.name}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onBack={() => ui.setProject("")}
            conversations={conversations}
            activeId={activeId}
            onSelectConversation={(id) => ui.setConversation(id)}
          />
        )}
      </section>

      {/* Right Section: Active Chat View */}
      <section className="flex min-h-0 flex-col bg-[#f3f6f4]">
        {activeId ? (
          <InboxChatView
            activeConversation={activeConversation}
            selectedProject={selectedProject}
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
