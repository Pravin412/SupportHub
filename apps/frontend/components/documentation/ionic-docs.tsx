import { CodeBlock } from "./code-block";

export function IonicDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Ionic / Capacitor Integration</h3>
      <p>Use the SupportHub widget script for Ionic web apps, or open the hosted widget URL inside a Capacitor Browser or WebView flow.</p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">Implementation steps</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Copy the Widget channel ID from Project Settings.</li>
          <li>For Ionic React, load <code>/widget.js</code> once from your app shell.</li>
          <li>Pass <code>data-channel-id</code>, <code>data-profile-id</code>, <code>data-name</code>, <code>data-email</code>, and <code>data-number</code> on the script tag.</li>
          <li>For native Capacitor flows, open <code>/widget</code> with the same values as URL query parameters.</li>
          <li>Keep the Integration key and Integration secret on your backend only.</li>
        </ol>
      </div>

      <CodeBlock
        code={`import { useEffect } from 'react';

const SUPPORT_HUB_SCRIPT_ID = 'supporthub-script';
const SUPPORT_HUB_CHANNEL_ID = 'YOUR_WIDGET_CHANNEL_ID';
const SUPPORT_HUB_SCRIPT_SRC = 'http://localhost:3000/widget.js';

type SupportHubIonicWidgetProps = {
  profileId: string;
  name?: string;
  email?: string;
  number?: string;
};

export function SupportHubIonicWidget({
  profileId,
  name,
  email,
  number
}: SupportHubIonicWidgetProps) {
  useEffect(() => {
    if (!profileId || document.getElementById(SUPPORT_HUB_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SUPPORT_HUB_SCRIPT_ID;
    script.src = SUPPORT_HUB_SCRIPT_SRC;
    script.async = true;
    script.dataset.channelId = SUPPORT_HUB_CHANNEL_ID;
    script.dataset.apiUrl = 'http://localhost:4000';
    script.dataset.profileId = profileId;
    script.dataset.name = name ?? '';
    script.dataset.email = email ?? '';
    script.dataset.number = number ?? '';
    document.body.appendChild(script);

    return () => {
      window.SupportHub?.destroy?.();
      script.remove();
    };
  }, [email, name, number, profileId]);

  useEffect(() => {
    window.SupportHub?.setUser?.(profileId, { name, email, number });
  }, [email, name, number, profileId]);

  return null;
}`}
      />

      <div className="mt-4">
        <h4 className="font-semibold text-slate-800">Capacitor Browser option</h4>
        <p className="mt-1 text-slate-600 mb-2">When you want a full-screen native browser experience, open the widget URL directly:</p>
        <CodeBlock
          code={`import { Browser } from '@capacitor/browser';

const params = new URLSearchParams({
  channelId: 'YOUR_WIDGET_CHANNEL_ID',
  profileId: 'USER_123',
  name: 'Jane Doe',
  email: 'jane@example.com',
  number: '+15551234567'
});

await Browser.open({
  url: \`http://localhost:3000/widget?\${params.toString()}\`
});`}
        />
      </div>

      <p className="text-xs text-slate-500">
        For Android emulator testing, use <code>10.0.2.2:3000</code> instead of <code>localhost:3000</code>. For physical devices, use your computer's LAN IP and run the frontend on <code>0.0.0.0</code>.
      </p>
    </div>
  );
}
