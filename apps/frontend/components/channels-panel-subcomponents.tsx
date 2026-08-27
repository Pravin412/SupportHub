"use client";
import { MessageCircle } from "lucide-react";
import { Button, Input } from "@support-hub/ui";

export function ChannelLogoUpload({
  channelId,
  currentLogo,
  onImageFile,
  onLogoUrlChange
}: {
  channelId: string;
  currentLogo: string;
  onImageFile: (channelId: string, file: File) => void;
  onLogoUrlChange: (url: string) => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {currentLogo ? (
            <div className="relative">
              <img
                src={currentLogo}
                alt="Logo preview"
                className="h-14 w-14 rounded-full object-cover border-2 border-teal-600 shadow-sm"
              />
            </div>
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400">
              <MessageCircle size={24} />
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-slate-900">Project / Bot Logo</div>
            <div className="text-2xs text-muted">Displayed in chatbot header, next to bot replies, and launcher.</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
            Upload Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageFile(channelId, file);
              }}
            />
          </label>
          {currentLogo && (
            <button
              type="button"
              className="h-8 px-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              onClick={() => onLogoUrlChange("")}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="mt-3">
        <span className="text-2xs text-slate-500">Or paste an Image URL:</span>
        <Input
          className="mt-1 h-8 text-xs bg-white"
          placeholder="https://example.com/logo.png"
          value={currentLogo}
          onChange={(e) => onLogoUrlChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function ChannelVisitorSettingsForm({
  colorTheme,
  settings,
  onUpdateSetting
}: {
  colorTheme: string;
  settings: {
    collectVisitorInfo: boolean;
    visitorNameEnabled: boolean;
    visitorEmailEnabled: boolean;
    visitorPhoneEnabled: boolean;
  };
  onUpdateSetting: (key: "collectVisitorInfo" | "visitorNameEnabled" | "visitorEmailEnabled" | "visitorPhoneEnabled", value: boolean) => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">New conversation form</h4>
          <p className="text-xs text-muted">Show a name, email, and phone form before the visitor starts chatting.</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal-700"
            checked={settings.collectVisitorInfo}
            onChange={(e) => onUpdateSetting("collectVisitorInfo", e.target.checked)}
          />
          Ask details on new conversation
        </label>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              ["visitorNameEnabled", "Name"],
              ["visitorEmailEnabled", "Email"],
              ["visitorPhoneEnabled", "Phone"]
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-teal-700"
                  checked={settings[key as keyof typeof settings]}
                  disabled={!settings.collectVisitorInfo}
                  onChange={(e) => onUpdateSetting(key as any, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">If name is off or left empty, the inbox contact name is generated automatically.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="mb-2 text-xs font-semibold text-slate-900">Form preview</div>
          {settings.collectVisitorInfo ? (
            <div className="space-y-2">
              {settings.visitorNameEnabled && <Input className="h-8 text-xs" placeholder="Name" readOnly />}
              {settings.visitorEmailEnabled && <Input className="h-8 text-xs" placeholder="Email" readOnly />}
              {settings.visitorPhoneEnabled && <Input className="h-8 text-xs" placeholder="Phone number" readOnly />}
              <Button type="button" style={{ backgroundColor: colorTheme }} className="h-8 w-full border-0 text-xs text-white">
                Continue
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-muted">
              Form is disabled. Visitors can start chatting immediately.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
