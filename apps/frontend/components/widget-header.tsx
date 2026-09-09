import { Bot, X } from "lucide-react";
import { Button } from "@support-hub/ui";

export const WidgetHeader = ({
  botLogo,
  botName,
  themeColor
}: {
  botLogo?: string | null;
  botName?: string;
  themeColor: string;
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: themeColor }}>
      <div className="flex items-center gap-3">
        {botLogo ? (
          <img src={botLogo} alt={botName || "Bot"} className="h-10 w-10 rounded-full object-cover border border-white/30 shadow-xs" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
            <Bot size={20} />
          </span>
        )}
        <div>
          <div className="text-sm font-semibold">{botName || "Support Bot"}</div>
          <div className="text-xs text-white/80">Typically replies in a few minutes</div>
        </div>
      </div>
      <Button
        onClick={() => window.parent.postMessage("supporthub-close-widget", "*")}
        className="h-8 w-8 rounded-full border-0 bg-transparent p-0 text-white hover:bg-white/20"
      >
        <X size={18} />
      </Button>
    </div>
  );
};
