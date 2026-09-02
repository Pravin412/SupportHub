"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, ChevronRight, Send, X } from "lucide-react";
import { Button, Input } from "@support-hub/ui";
import { widgetApi } from "../lib/api";
import { ClientEvent } from "../lib/events";
import { io, Socket } from "socket.io-client";
import { WidgetMessagesList } from "./widget-messages-list";
import { WidgetVisitorForm, WidgetLoadingSkeleton } from "./widget-form-and-loading";

let API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
  API_URL = `${window.location.protocol}//${window.location.hostname}:4000`;
}

function guestProfileStorageKey(channelId: string) {
  return `supporthub:guest-profile:${channelId}`;
}

export function WidgetContainer() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get("channelId") || undefined;
  const initProfileId = searchParams.get("profileId") || undefined;
  const initName = searchParams.get("name") || undefined;
  const initEmail = searchParams.get("email") || undefined;
  const initNumber = searchParams.get("number") || undefined;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<{ profileId?: string; name?: string; email?: string; number?: string }>({ 
    profileId: initProfileId, name: initName, email: initEmail, number: initNumber 
  });
  const [visitorForm, setVisitorForm] = useState({ name: initName ?? "", email: initEmail ?? "", number: initNumber ?? "" });
  const [visitorFormSubmitted, setVisitorFormSubmitted] = useState(Boolean(initName || initEmail || initNumber));
  const [visitorFormRequested, setVisitorFormRequested] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [hasExistingConversation, setHasExistingConversation] = useState(false);
  const [hasHostUser, setHasHostUser] = useState(Boolean(initProfileId && (initName || initEmail || initNumber)));
  const [config, setConfig] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subscribeToConversation = (conversationId?: string) => {
    if (!conversationId) return;
    socketRef.current?.emit("conversation:subscribe", conversationId);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!channelId || activeUser.profileId) return;
    const storageKey = guestProfileStorageKey(channelId);
    const storedProfileId = window.localStorage.getItem(storageKey);
    const profileId = storedProfileId || `guest-${typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2)}`;
    if (!storedProfileId) {
      window.localStorage.setItem(storageKey, profileId);
    }
    setActiveUser((current) => ({
      ...current,
      profileId: current.profileId ?? profileId
    }));
  }, [activeUser.profileId, channelId]);

  useEffect(() => {
    if (!channelId) return;
    let isMounted = true;

    const loadData = async () => {
      try {
        const configData = await widgetApi.config(channelId);
        if (!isMounted) return;
        
        setConfig(configData);
        if (configData.colorTheme || configData.logoUrl) {
          window.parent.postMessage({ 
            type: 'supporthub-config', 
            colorTheme: configData.colorTheme,
            logoUrl: configData.logoUrl 
          }, '*');
        }

        if (activeUser.profileId) {
          const history = await widgetApi.messages(channelId, activeUser.profileId);
          if (!isMounted) return;
          
          if (history && history.length > 0) {
            const orderedHistory = history.reverse();
            setMessages(orderedHistory);
            setHasExistingConversation(true);
            setConversationStarted(true);
            subscribeToConversation(orderedHistory.find((msg) => msg.conversationId)?.conversationId);
          } else {
            setMessages([{ id: "welcome", content: configData.welcomeMessage, senderType: "BOT" }]);
            setHasExistingConversation(false);
            setConversationStarted(hasHostUser);
          }
        } else {
          setMessages([{ id: "welcome", content: configData.welcomeMessage, senderType: "BOT" }]);
          setHasExistingConversation(false);
          setConversationStarted(hasHostUser);
        }
      } catch (err) {
        console.error("Failed to load widget data", err);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [channelId, activeUser.profileId, hasHostUser]);

  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket", "polling"], reconnection: true });
    socketRef.current = socket;

    socket.on(ClientEvent.MessageCreated, (newMsg) => {
      setMessages((prev) => {
        const currentConvId = prev.find((m) => m.conversationId)?.conversationId;
        if (currentConvId && newMsg.conversationId && newMsg.conversationId !== currentConvId) return prev;
        if (prev.some((m) => m.id === newMsg.id)) return prev;

        const pendingIdx = prev.findIndex(
          (m) => m.id.startsWith("temp-") && m.content === newMsg.content && m.senderType === "CUSTOMER"
        );
        if (pendingIdx !== -1) {
          const updated = [...prev];
          updated[pendingIdx] = newMsg;
          return updated;
        }
        if (newMsg.conversationId && socketRef.current) {
          socketRef.current.emit("conversation:subscribe", newMsg.conversationId);
        }
        return [...prev, newMsg];
      });
    });

    return () => { socket.disconnect(); };
  }, [channelId, activeUser.profileId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'supporthub-set-user') return;
      const { profileId, name, email, number } = event.data;
      setActiveUser({ profileId, name, email, number });
      setVisitorForm({ name: name || "", email: email || "", number: number || "" });
      setVisitorFormSubmitted(Boolean(name || email || number));
      setVisitorFormRequested(false);
      setHasHostUser(true);
      setConversationStarted(true);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendWidgetMessage = async (
    text: string,
    user = activeUser
  ) => {
    if (!text.trim() || !channelId || !user.profileId || isSendingRef.current) return;

    const content = text.trim();
    isSendingRef.current = true;
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, content, senderType: "CUSTOMER" }]);

    try {
      const sentMsg = await widgetApi.sendMessage(
        channelId, 
        user.profileId, 
        content, 
        user.name, 
        user.email, 
        user.number
      );
      setMessages(prev => prev.some(m => m.id === sentMsg.id) ? prev.filter(m => m.id !== tempId) : prev.map(m => m.id === tempId ? sentMsg : m));
      subscribeToConversation(sentMsg.conversationId);
    } catch (err) {
      console.error("Failed to send", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const shouldCollectVisitorInfo = Boolean(
    config?.collectVisitorInfo && activeUser.profileId && !visitorFormSubmitted && !hasExistingConversation
    && !hasHostUser
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || !channelId || !activeUser.profileId || isSendingRef.current) return;
    if (!conversationStarted) return;

    setMessage("");
    await sendWidgetMessage(text);
  };

  const themeColor = config?.colorTheme || "#0f4c42";
  const botLogo = config?.logoUrl || config?.botAvatar || null;
  const shouldShowVisitorForm = Boolean(shouldCollectVisitorInfo && visitorFormRequested);
  const shouldShowNewConversationScreen = Boolean(config && !conversationStarted && !hasExistingConversation);

  const saveVisitorForm = (values: { name: string; email: string; number: string }) => {
    const nextUser = {
      ...activeUser,
      name: config?.visitorNameEnabled ? values.name.trim() : undefined,
      email: config?.visitorEmailEnabled ? values.email.trim() : undefined,
      number: config?.visitorPhoneEnabled ? values.number.trim() : undefined
    };
    setVisitorForm(values);
    setActiveUser(nextUser);
    setVisitorFormSubmitted(true);
    setVisitorFormRequested(false);
    setConversationStarted(true);
  };

  const handleOptionSend = async (text: string) => {
    if (!text || !channelId || !activeUser.profileId || isSendingRef.current) return;
    if (!conversationStarted) return;
    await sendWidgetMessage(text);
  };

  const startConversation = () => {
    if (shouldCollectVisitorInfo) {
      setVisitorFormRequested(true);
      return;
    }
    setVisitorFormSubmitted(true);
    setConversationStarted(true);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white text-slate-900 overflow-hidden shadow-xl border border-slate-200" style={{ borderRadius: '12px' }}>
      <div className={`flex flex-col h-full w-full ${!config ? 'filter blur-xs select-none pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: themeColor }}>
          <div className="flex items-center gap-3">
            {botLogo ? (
              <img src={botLogo} alt={config?.botName || "Bot"} className="h-10 w-10 rounded-full object-cover border border-white/30 shadow-xs" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20"><Bot size={20} /></span>
            )}
            <div>
              <div className="text-sm font-semibold">{config?.botName || "Support Bot"}</div>
              <div className="text-xs text-white/80">Typically replies in a few minutes</div>
            </div>
          </div>
          <Button onClick={() => window.parent.postMessage('supporthub-close-widget', '*')} className="h-8 w-8 rounded-full border-0 bg-transparent p-0 text-white hover:bg-white/20">
            <X size={18} />
          </Button>
        </div>

        {/* Chat / Message List */}
        <div className="flex-1 flex flex-col min-h-0">
          {shouldShowNewConversationScreen ? (
            <NewConversationScreen
              botName={config?.botName || "Support Bot"}
              botLogo={botLogo}
              themeColor={themeColor}
              showForm={shouldShowVisitorForm}
              config={config}
              visitorForm={visitorForm}
              onFormSubmit={saveVisitorForm}
              onStart={startConversation}
            />
          ) : (
            <>
              <WidgetMessagesList
                messages={messages}
                themeColor={themeColor}
                isSending={isSending}
                onSendOption={handleOptionSend}
                messagesEndRef={messagesEndRef}
              />
            </>
          )}
        </div>

        {/* Input Area */}
        {!shouldShowNewConversationScreen && (
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
              disabled={isSending || !conversationStarted || !config}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-all disabled:opacity-75"
            />
            <Button
              type="submit"
              disabled={!message.trim() || !channelId || !activeUser.profileId || isSending || !conversationStarted || !config}
              style={{ backgroundColor: themeColor }}
              className="h-10 w-10 rounded-lg border-0 px-0 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
            </Button>
          </form>
        )}
      </div>

      {!config && <WidgetLoadingSkeleton themeColor={themeColor} />}
    </div>
  );
}

function NewConversationScreen({
  botName,
  botLogo,
  themeColor,
  showForm,
  config,
  visitorForm,
  onFormSubmit,
  onStart
}: {
  botName: string;
  botLogo?: string | null;
  themeColor: string;
  showForm: boolean;
  config: any;
  visitorForm: { name: string; email: string; number: string };
  onFormSubmit: (values: { name: string; email: string; number: string }) => void;
  onStart: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <div className="flex-1 px-5 py-8">
        {botLogo ? (
          <img src={botLogo} alt={botName} className="h-14 w-14 rounded-full border border-slate-200 bg-white object-cover shadow-sm" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm">
            <Bot size={24} />
          </span>
        )}
        <h1 className="mt-7 text-2xl font-bold leading-snug text-slate-950">
          Hello! Welcome to {botName}. How can I assist you today?
        </h1>
      </div>
      <div className="rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        {showForm ? (
          <WidgetVisitorForm config={config} visitorForm={visitorForm} onSubmit={onFormSubmit} themeColor={themeColor} />
        ) : (
          <div>
            <div className="text-sm font-bold text-slate-950">We are away at the moment</div>
            <div className="mt-2 text-sm text-slate-500">Typically replies in a few minutes</div>
            <button
              type="button"
              onClick={onStart}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: themeColor }}
            >
              Start conversation
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
