import { Bot, ChevronRight } from "lucide-react";
import { WidgetVisitorForm } from "./widget-form-and-loading";

export function NewConversationScreen({
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
            <button type="button" onClick={onStart} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: themeColor }}>
              Start conversation
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
