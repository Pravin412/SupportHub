"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Send, X } from "lucide-react";
import { Button, Input } from "@support-hub/ui";
import { widgetApi } from "../lib/api";
import { io, Socket } from "socket.io-client";
import { WidgetMessagesList } from "./widget-messages-list";
import { WidgetVisitorForm, WidgetLoadingSkeleton } from "./widget-form-and-loading";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  const [visitorFormSubmitted, setVisitorFormSubmitted] = useState(Boolean(initProfileId || initName || initEmail || initNumber));
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
    setActiveUser((current) => ({
      ...current,
      profileId: current.profileId ?? `guest-${crypto.randomUUID()}`
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
            subscribeToConversation(orderedHistory.find((msg) => msg.conversationId)?.conversationId);
          } else {
            setMessages([{ id: "welcome", content: configData.welcomeMessage, senderType: "BOT" }]);
          }
        } else {
          setMessages([{ id: "welcome", content: configData.welcomeMessage, senderType: "BOT" }]);
        }
      } catch (err) {
        console.error("Failed to load widget data", err);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [channelId, activeUser.profileId]);

  useEffect(() => {
    const socket = io(API_URL, { transports: ["websocket", "polling"], reconnection: true });
    socketRef.current = socket;

    socket.on("message.created", (newMsg) => {
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
      setVisitorFormSubmitted(true);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !channelId || !activeUser.profileId || isSendingRef.current) return;
    
    const text = message.trim();
    isSendingRef.current = true;
    setIsSending(true);
    setMessage("");

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, content: text, senderType: "CUSTOMER" }]);

    try {
      const sentMsg = await widgetApi.sendMessage(
        channelId, 
        activeUser.profileId, 
        text, 
        activeUser.name, 
        activeUser.email, 
        activeUser.number
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

  const themeColor = config?.colorTheme || "#0f4c42";
  const botLogo = config?.logoUrl || config?.botAvatar || null;
  const shouldShowVisitorForm = Boolean(config?.collectVisitorInfo && activeUser.profileId && !visitorFormSubmitted);

  const saveVisitorForm = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveUser((current) => ({
      ...current,
      name: config?.visitorNameEnabled ? visitorForm.name.trim() || undefined : undefined,
      email: config?.visitorEmailEnabled ? visitorForm.email.trim() || undefined : undefined,
      number: config?.visitorPhoneEnabled ? visitorForm.number.trim() || undefined : undefined
    }));
    setVisitorFormSubmitted(true);
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
          {shouldShowVisitorForm && (
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <WidgetVisitorForm config={config} visitorForm={visitorForm} setVisitorForm={setVisitorForm} onSubmit={saveVisitorForm} themeColor={themeColor} />
            </div>
          )}
          <WidgetMessagesList
            messages={messages}
            themeColor={themeColor}
            channelId={channelId}
            activeUser={activeUser}
            isSending={isSending}
            setMessages={setMessages}
            subscribeToConversation={subscribeToConversation}
            messagesEndRef={messagesEndRef}
          />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message..."
            disabled={isSending || shouldShowVisitorForm || !config}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-all disabled:opacity-75"
          />
          <Button
            type="submit"
            disabled={!message.trim() || !channelId || !activeUser.profileId || isSending || shouldShowVisitorForm || !config}
            style={{ backgroundColor: themeColor }}
            className="h-10 w-10 rounded-lg border-0 px-0 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </Button>
        </form>
      </div>

      {!config && <WidgetLoadingSkeleton themeColor={themeColor} />}
    </div>
  );
}
