import { CodeBlock } from "./code-block";

export function NextjsDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Next.js / React Integration</h3>
      <p>Mount the widget script once, then call <code>SupportHub.setUser</code> when your logged-in user is available.</p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">Implementation steps</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Create or select the project in SupportHub.</li>
          <li>Open Project Settings and copy the Widget channel ID.</li>
          <li>Add the widget component once in your app layout or authenticated shell.</li>
          <li>Pass your logged-in user's stable ID as <code>profileId</code>.</li>
          <li>Pass optional <code>name</code>, <code>email</code>, and <code>number</code> so tickets and conversations show the real customer.</li>
        </ol>
      </div>
      
      <CodeBlock
        code={`'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    SupportHub?: {
      setUser?: (
        userId: string,
        user: { name?: string; email?: string; number?: string }
      ) => void;
      open?: () => void;
      close?: () => void;
      destroy?: () => void;
    };
  }
}

const SUPPORT_HUB_SCRIPT_ID = 'supporthub-script';
const SUPPORT_HUB_CHANNEL_ID = 'YOUR_WIDGET_CHANNEL_ID';
const SUPPORT_HUB_SCRIPT_SRC = 'http://localhost:3000/widget.js';

type SupportHubWidgetProps = {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userNumber?: string;
  isUserLoading?: boolean;
};

export default function SupportHubWidget({
  userId,
  userName,
  userEmail,
  userNumber,
  isUserLoading
}: SupportHubWidgetProps) {
  const canIdentifyUser = Boolean(userId);

  useEffect(() => {
    if (isUserLoading || !canIdentifyUser) return;
    if (document.getElementById(SUPPORT_HUB_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SUPPORT_HUB_SCRIPT_ID;
    script.src = \`\${SUPPORT_HUB_SCRIPT_SRC}?v=\${Date.now()}\`;
    script.async = true;
    script.dataset.channelId = SUPPORT_HUB_CHANNEL_ID;
    script.dataset.apiUrl = 'http://localhost:4000';
    script.dataset.profileId = userId;
    script.dataset.name = userName ?? '';
    script.dataset.email = userEmail ?? '';
    script.dataset.number = userNumber ?? '';
    document.body.appendChild(script);

    return () => {
      window.SupportHub?.destroy?.();
      script.remove();
    };
  }, [canIdentifyUser, isUserLoading, userEmail, userId, userName, userNumber]);

  useEffect(() => {
    if (isUserLoading || !canIdentifyUser) return;

    const setUser = () => {
      window.SupportHub?.setUser?.(userId, {
        name: userName,
        email: userEmail,
        number: userNumber
      });
    };

    setUser();
    const retryTimer = window.setTimeout(setUser, 1000);
    return () => window.clearTimeout(retryTimer);
  }, [canIdentifyUser, isUserLoading, userEmail, userId, userName, userNumber]);

  return null;
}`}
      />
      <p className="text-xs text-slate-500">
        Pass <code>profileId</code>, <code>name</code>, <code>email</code>, and <code>number</code> during script initialization. Call <code>setUser</code> after load as a backup. When a stable user ID is present, the visitor form is skipped and previous messages load for that contact.
      </p>
      <CodeBlock
        code={`<SupportHubWidget
  userId="YOUR_STABLE_USER_ID"
  userName="USER_DISPLAY_NAME"
  userEmail="USER_EMAIL"
  userNumber="USER_PHONE_NUMBER"
  isUserLoading={false}
/>`}
      />
    </div>
  );
}
