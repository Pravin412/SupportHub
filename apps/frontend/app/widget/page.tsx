"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, CheckCheck, Send, X } from "lucide-react";
import { Button, Input } from "@support-hub/ui";
import { widgetApi } from "../../lib/api";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function WidgetPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading chat...</div>}>
      <WidgetContent />
    </Suspense>
  );
}

function WidgetContent() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get("channelId") || undefined;
  const initProfileId = searchParams.get("profileId") || undefined;
  const initName = searchParams.get("name") || undefined;
  const initNumber = searchParams.get("number") || undefined;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<{ profileId?: string; name?: string; number?: string }>({ 
    profileId: initProfileId, name: initName, number: initNumber 
  });
  const [config, setConfig] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subscribeToConversation = (conversationId?: string) => {
    if (!conversationId) return;
    socketRef.current?.emit("conversation:subscribe", conversationId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!channelId || activeUser.profileId) return;

    const storageKey = `supporthub:${channelId}:guest-profile`;
    const existingProfileId = window.localStorage.getItem(storageKey);
    const guestProfileId = existingProfileId ?? `guest-${crypto.randomUUID()}`;

    if (!existingProfileId) {
      window.localStorage.setItem(storageKey, guestProfileId);
    }

    const shortCode = guestProfileId.replace(/^guest-/, "").slice(0, 4).toUpperCase();
    const defaultVisitorName = `Visitor #${shortCode}`;

    setActiveUser((current) => ({
      ...current,
      profileId: current.profileId ?? guestProfileId,
      name: current.name ?? defaultVisitorName
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
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true
    });
    socketRef.current = socket;

    // Listen for new messages
    socket.on("message.created", (newMsg) => {
      setMessages((prev) => {
        const currentConvId = prev.find((m) => m.conversationId)?.conversationId;
        
        // If we know our conversation ID and the message has a different conversation ID, ignore
        if (currentConvId && newMsg.conversationId && newMsg.conversationId !== currentConvId) {
          return prev;
        }

        // Check if message with this ID already exists
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }

        // If it's a customer message matching our pending optimistic message, replace the temp message
        const pendingOptimisticIndex = prev.findIndex(
          (m) => m.id.startsWith("temp-") && m.content === newMsg.content && m.senderType === "CUSTOMER"
        );

        if (pendingOptimisticIndex !== -1) {
          const updated = [...prev];
          updated[pendingOptimisticIndex] = newMsg;
          return updated;
        }

        // Auto subscribe to the new message conversation if not already subscribed
        if (newMsg.conversationId && socketRef.current) {
          socketRef.current.emit("conversation:subscribe", newMsg.conversationId);
        }

        return [...prev, newMsg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [channelId, activeUser.profileId]);

  // Subscribe socket to conversation room whenever conversationId is available
  useEffect(() => {
    const activeConvId = messages.find((m) => m.conversationId)?.conversationId;
    if (activeConvId && socketRef.current) {
      socketRef.current.emit("conversation:subscribe", activeConvId);
    }
  }, [messages]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'supporthub-set-user') return;
      const { profileId, name, number } = event.data;
      setActiveUser({ profileId, name, number });
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  const closeWidget = () => {
    window.parent.postMessage('supporthub-close-widget', '*');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !channelId || !activeUser.profileId || isSendingRef.current) return;
    
    const text = message.trim();
    isSendingRef.current = true;
    setIsSending(true);
    setMessage("");

    // Optimistic UI with unique prefix
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, content: text, senderType: "CUSTOMER" }]);

    try {
      const sentMsg = await widgetApi.sendMessage(
        channelId, 
        activeUser.profileId, 
        text, 
        activeUser.name, 
        activeUser.number
      );
      
      setMessages(prev => {
        // If the socket already replaced or added sentMsg, avoid duplicate
        if (prev.some(m => m.id === sentMsg.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => m.id === tempId ? sentMsg : m);
      });
      subscribeToConversation(sentMsg.conversationId);
      
    } catch (err) {
      console.error("Failed to send", err);
      // Remove failed optimistic message
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const themeColor = config?.colorTheme || "#0f4c42";
  const botLogo = config?.logoUrl || config?.botAvatar || null;

  return (
    <div className="flex flex-col h-full w-full bg-white text-slate-900 overflow-hidden shadow-xl border border-slate-200" style={{ borderRadius: '12px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: themeColor }}>
        <div className="flex items-center gap-3">
          {botLogo ? (
            <img
              src={botLogo}
              alt={config?.botName || "Bot"}
              className="h-10 w-10 rounded-full object-cover border border-white/30 shadow-xs"
            />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
              <Bot size={20} />
            </span>
          )}
          <div>
            <div className="text-sm font-semibold">{config?.botName || "Support Bot"}</div>
            <div className="text-xs text-white/80">Typically replies in a few minutes</div>
          </div>
        </div>
        <Button onClick={closeWidget} className="h-8 w-8 rounded-full border-0 bg-transparent p-0 text-white hover:bg-white/20">
          <X size={18} />
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
        {messages.map(msg => {
          const isUser = msg.senderType === "CUSTOMER";
          const time = msg.createdAt ? formatMessageTime(msg.createdAt) : formatMessageTime(new Date().toISOString());

          // Parse options if message content contains JSON options
          let parsedContent: { text?: string; options?: Array<{ title: string; value: string }>; isOptions?: boolean } | null = null;
          try {
            if (typeof msg.content === "string" && msg.content.startsWith("{") && msg.content.includes('"isOptions"')) {
              parsedContent = JSON.parse(msg.content);
            }
          } catch {
            parsedContent = null;
          }

          const displayText = parsedContent?.text || msg.content;
          const optionsList = parsedContent?.options || [];

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
              <div className={`flex items-start gap-2 max-w-[90%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {!isUser && (
                  botLogo ? (
                    <img
                      src={botLogo}
                      alt="Bot"
                      className="h-7 w-7 rounded-full object-cover border border-slate-200 mt-0.5 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold mt-0.5 shrink-0">
                      <Bot size={13} />
                    </span>
                  )
                )}

                <div
                  style={isUser ? { backgroundColor: themeColor, color: "white", borderRadius: "16px 16px 0px 16px" } : { borderRadius: "16px 16px 16px 0px" }}
                  className={`p-3 text-sm shadow-sm whitespace-pre-wrap ${
                    isUser
                      ? ""
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  {displayText}

                  {/* Render interactive options/buttons */}
                  {optionsList.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                      {optionsList.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={async () => {
                            const optionText = opt.value || opt.title;
                            if (!optionText || isSending) return;
                            
                            // Send option selection back as a user reply
                            const tempId = `temp-${Date.now()}`;
                            setMessages(prev => [...prev, { id: tempId, content: optionText, senderType: "CUSTOMER" }]);
                            
                            try {
                              const sentMsg = await widgetApi.sendMessage(
                                channelId!,
                                activeUser.profileId!,
                                optionText,
                                activeUser.name,
                                activeUser.number
                              );
                              setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
                              subscribeToConversation(sentMsg.conversationId);
                            } catch (err) {
                              console.error("Failed to send option", err);
                            }
                          }}
                          style={{ borderColor: themeColor, color: themeColor }}
                          className="rounded-full border bg-white px-3 py-1 text-xs font-semibold shadow-2xs transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
                        >
                          {opt.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {msg.id !== "welcome" && (
                <div className={`mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500 ${isUser ? "pr-1" : "pl-1"}`}>
                  <span>{time}</span>
                  {isUser ? <CheckCheck size={12} style={{ color: themeColor }} /> : null}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          disabled={isSending}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-all disabled:opacity-75"
        />
        <Button
          type="submit"
          disabled={!message.trim() || !channelId || !activeUser.profileId || isSending}
          style={{ backgroundColor: themeColor }}
          className="h-10 w-10 rounded-lg border-0 px-0 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}
