import { WidgetLoadingSkeleton } from "./widget-form-and-loading";
import { WidgetHeader } from "./widget-header";
import { WidgetMessageForm } from "./widget-message-form";
import { WidgetMessagesList } from "./widget-messages-list";
import { NewConversationScreen } from "./widget-new-conversation-screen";

export function WidgetFrame({
  activeUser,
  channelId,
  config,
  conversationStarted,
  handleOptionSend,
  handleSend,
  isSending,
  message,
  messages,
  messagesEndRef,
  saveVisitorForm,
  setMessage,
  shouldShowNewConversationScreen,
  shouldShowVisitorForm,
  startConversation,
  themeColor,
  visitorForm
}: {
  activeUser: { profileId?: string };
  channelId?: string;
  config: any;
  conversationStarted: boolean;
  handleOptionSend: (text: string) => Promise<void>;
  handleSend: (event: React.FormEvent) => void;
  isSending: boolean;
  message: string;
  messages: any[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  saveVisitorForm: (values: { name: string; email: string; number: string }) => void;
  setMessage: (message: string) => void;
  shouldShowNewConversationScreen: boolean;
  shouldShowVisitorForm: boolean;
  startConversation: () => void;
  themeColor: string;
  visitorForm: { name: string; email: string; number: string };
}) {
  const botLogo = config?.logoUrl || config?.botAvatar || null;

  return (
    <div className="flex flex-col h-full w-full bg-white text-slate-900 overflow-hidden shadow-xl border border-slate-200" style={{ borderRadius: "12px" }}>
      <div className={`flex flex-col h-full w-full ${!config ? "filter blur-xs select-none pointer-events-none" : ""}`}>
        <WidgetHeader botLogo={botLogo} botName={config?.botName} themeColor={themeColor} />
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
            <WidgetMessagesList
              messages={messages}
              themeColor={themeColor}
              botName={config?.botName}
              isSending={isSending}
              onSendOption={handleOptionSend}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
        {!shouldShowNewConversationScreen && (
          <WidgetMessageForm
            message={message}
            themeColor={themeColor}
            disabled={!channelId || !activeUser.profileId || isSending || !conversationStarted || !config}
            isSending={isSending}
            onMessageChange={setMessage}
            onSubmit={handleSend}
          />
        )}
      </div>
      {!config && <WidgetLoadingSkeleton themeColor={themeColor} />}
    </div>
  );
}
