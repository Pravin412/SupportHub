"use client";
import { UserRound } from "lucide-react";
import { Button, Input } from "@support-hub/ui";

export function WidgetVisitorForm({
  config,
  visitorForm,
  setVisitorForm,
  onSubmit,
  themeColor
}: {
  config: any;
  visitorForm: { name: string; email: string; number: string };
  setVisitorForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; number: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  themeColor: string;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm mb-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <UserRound size={16} style={{ color: themeColor }} />
        Start a new conversation
      </div>
      <div className="space-y-2">
        {config?.visitorNameEnabled && (
          <Input
            value={visitorForm.name}
            onChange={(e) => setVisitorForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
            className="h-9 text-sm"
          />
        )}
        {config?.visitorEmailEnabled && (
          <Input
            type="email"
            value={visitorForm.email}
            onChange={(e) => setVisitorForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="h-9 text-sm"
          />
        )}
        {config?.visitorPhoneEnabled && (
          <Input
            value={visitorForm.number}
            onChange={(e) => setVisitorForm((prev) => ({ ...prev, number: e.target.value }))}
            placeholder="Phone number"
            className="h-9 text-sm"
          />
        )}
      </div>
      <Button type="submit" style={{ backgroundColor: themeColor }} className="mt-3 h-9 w-full border-0 text-sm text-white">
        Continue
      </Button>
    </form>
  );
}

export function WidgetLoadingSkeleton({ themeColor }: { themeColor: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
      <div className="flex items-center gap-2 drop-shadow-sm">
        <span className="h-2.5 w-2.5 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ backgroundColor: themeColor, animationDelay: "0ms" }} />
        <span className="h-2.5 w-2.5 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ backgroundColor: themeColor, animationDelay: "160ms" }} />
        <span className="h-2.5 w-2.5 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ backgroundColor: themeColor, animationDelay: "320ms" }} />
        <span className="h-2.5 w-2.5 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ backgroundColor: themeColor, animationDelay: "480ms" }} />
      </div>
    </div>
  );
}
