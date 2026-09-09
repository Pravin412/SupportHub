import { Send } from "lucide-react";
import { Button, Input } from "@support-hub/ui";

export const WidgetMessageForm = ({
  message,
  themeColor,
  disabled,
  isSending,
  onMessageChange,
  onSubmit
}: {
  message: string;
  themeColor: string;
  disabled: boolean;
  isSending: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) => {
  return (
    <form onSubmit={onSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
      <Input
        type="text"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="Write a message..."
        disabled={disabled}
        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-all disabled:opacity-75"
      />
      <Button
        type="submit"
        disabled={!message.trim() || disabled || isSending}
        style={{ backgroundColor: themeColor }}
        className="h-10 w-10 rounded-lg border-0 px-0 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={16} />
      </Button>
    </form>
  );
};
