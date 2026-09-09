"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { widgetApi } from "../lib/api";
import { ClientEvent } from "../lib/events";
import { WIDGET_API_URL, guestProfileStorageKey } from "../lib/widget-config";
import { io, Socket } from "socket.io-client";
import { WidgetFrame } from "./widget-frame";
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
    const socket = io(WIDGET_API_URL, { transports: ["websocket", "polling"], reconnection: true });
    socketRef.current = socket;

    socket.on(ClientEvent.MessageCreated, (newMsg) => {
      setMessages((prev) => {
        const currentConvId = prev.find((msg) => msg.conversationId)?.conversationId;
        if (currentConvId && newMsg.conversationId && newMsg.conversationId !== currentConvId) return prev;
        if (prev.some((msg) => msg.id === newMsg.id)) return prev;

        const pendingIdx = prev.findIndex(
          (msg) => msg.id.startsWith("temp-") && msg.content === newMsg.content && msg.senderType === "CUSTOMER"
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
      setMessages(prev => prev.some(msg => msg.id === sentMsg.id) ? prev.filter(msg => msg.id !== tempId) : prev.map(msg => msg.id === tempId ? sentMsg : msg));
      subscribeToConversation(sentMsg.conversationId);
    } catch (err) {
      console.error("Failed to send", err);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
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
    <WidgetFrame
      activeUser={activeUser}
      channelId={channelId}
      config={config}
      conversationStarted={conversationStarted}
      handleOptionSend={handleOptionSend}
      handleSend={handleSend}
      isSending={isSending}
      message={message}
      messages={messages}
      messagesEndRef={messagesEndRef}
      saveVisitorForm={saveVisitorForm}
      setMessage={setMessage}
      shouldShowNewConversationScreen={shouldShowNewConversationScreen}
      shouldShowVisitorForm={shouldShowVisitorForm}
      startConversation={startConversation}
      themeColor={themeColor}
      visitorForm={visitorForm}
    />
  );
}
