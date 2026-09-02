"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@support-hub/ui";

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative group bg-slate-950 text-slate-200 p-4 rounded-md overflow-x-auto text-xs leading-relaxed font-mono">
      <button
        type="button"
        className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        title="Copy code"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export function TabButton({ children, active, onClick, icon }: any) {
  return (
    <Button
      onClick={onClick}
      className={`h-auto rounded-none border-0 border-b-2 bg-transparent px-4 py-2 text-sm font-medium shadow-none transition-colors whitespace-nowrap ${
        active 
          ? "border-teal-600 text-teal-700" 
          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
      }`}
    >
      {icon}
      {children}
    </Button>
  );
}

export function ProjectSetupDocs() {
  return (
    <div className="p-5 space-y-5 text-sm text-slate-700">
      <div>
        <h3 className="font-semibold text-lg text-slate-900">Project Setup & Configuration</h3>
        <p className="mt-1 text-slate-600">
          Use these steps when a new internal team or client project needs SupportHub chat, tickets, webhooks, and bot configuration.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">1. Create a project</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Login to the SupportHub dashboard.</li>
          <li>Open <b>Projects</b> from the left sidebar.</li>
          <li>Click <b>Create Project</b>.</li>
          <li>Enter the project name, for example <code>Tele Doctor</code>.</li>
          <li>Save the project. SupportHub creates the project key, widget channel, integration key, and integration secret.</li>
        </ol>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">2. Configure the chat widget</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Open the project settings page.</li>
          <li>Go to the widget/channel settings.</li>
          <li>Copy the <b>Widget channel ID</b>. Frontend and mobile teams use this value as <code>channelId</code>.</li>
          <li>Set the welcome message, theme color, launcher position, and visitor form options.</li>
          <li>Enable visitor name, email, or phone collection only if the project needs those details before chat starts.</li>
        </ol>
        <CodeBlock
          code={`Widget channel ID usage:

Web script:
data-channel-id="YOUR_WIDGET_CHANNEL_ID"

Mobile WebView:
/widget?channelId=YOUR_WIDGET_CHANNEL_ID&profileId=USER_123`}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">3. Add bot name, bot image, and fallback message</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Open <b>Project Settings &gt; Bot</b>.</li>
          <li>Set the bot display name, for example <code>Tele Doctor Bot</code>.</li>
          <li>Add the bot image/avatar URL in the bot avatar or logo field.</li>
          <li>Set the fallback message shown when the internal automated bot replies.</li>
          <li>Add handoff keywords such as <code>agent</code>, <code>human</code>, or <code>help</code> if the project should create a ticket and assign the chat to support.</li>
        </ol>
        <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-amber-900">
          Use a public HTTPS image URL for the bot image so it loads inside browser widgets and mobile WebViews.
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">4. Configure webhook automation</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Ask the backend team for a public HTTPS webhook endpoint.</li>
          <li>Open <b>Project Settings &gt; Webhook</b>.</li>
          <li>Paste the webhook endpoint URL and save.</li>
          <li>Copy the generated webhook signing secret and store it in the external backend.</li>
          <li>The external backend must verify signatures before processing webhook payloads.</li>
        </ol>
        <CodeBlock
          code={`Example webhook URL:
https://your-backend.com/api/supporthub-webhook

Secret usage:
SUPPORT_HUB_WEBHOOK_SIGNING_SECRET=YOUR_WEBHOOK_SIGNING_SECRET`}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">5. Configure backend integration credentials</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Open <b>Project Settings &gt; Integration</b>.</li>
          <li>Copy the <b>Integration key</b> and <b>Integration secret</b>.</li>
          <li>Store the secret only in the backend environment, never in frontend or mobile code.</li>
          <li>Use these credentials when a bot sends replies or updates conversation status.</li>
        </ol>
        <CodeBlock
          code={`SUPPORT_HUB_BASE_URL=http://localhost:4000
SUPPORT_HUB_INTEGRATION_KEY=YOUR_INTEGRATION_KEY
SUPPORT_HUB_INTEGRATION_SECRET=YOUR_INTEGRATION_SECRET`}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">6. Configure ticket email notifications</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Open <b>Project Settings &gt; Ticket Emails</b>.</li>
          <li>Add one or more notification recipient emails.</li>
          <li>Enable ticket created, ticket assigned, conversation assigned, or message received notifications as needed.</li>
          <li>For local testing, use <code>EMAIL_PROVIDER="log"</code> so emails print in backend logs.</li>
          <li>For production SMTP, configure the SMTP values in the backend environment.</li>
        </ol>
      </div>

      <div className="rounded-md border border-teal-200 bg-teal-50/50 p-4 text-xs text-teal-900 space-y-1">
        <div className="font-semibold">Quick rules for developers:</div>
        <div>Use <code>channelId</code> only for the widget.</div>
        <div>Use the Integration key and Integration secret only in backend APIs.</div>
        <div>Use the webhook signing secret only to verify incoming webhook calls.</div>
        <div>For human handoff, include <code>{"\"status\": \"OPEN\", \"assignedTo\": \"human\""}</code> in your bot reply message payload.</div>
      </div>
    </div>
  );
}

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

export function FlutterDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Flutter Mobile Integration</h3>
      <p>In Flutter apps, use the <code>webview_flutter</code> package to open the chat interface full-screen or in a bottom sheet modal.</p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">Implementation steps</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Use the frontend widget URL, not the backend API URL.</li>
          <li>Load <code>/widget</code> inside the WebView.</li>
          <li>Send <code>channelId</code>, <code>profileId</code>, <code>name</code>, <code>email</code>, and <code>number</code> as URL query parameters.</li>
          <li>Use <code>postMessage</code> only when the user details become available after the WebView is already open.</li>
          <li>For Android emulator testing, use <code>10.0.2.2:3000</code>. For real devices, use the computer's LAN IP.</li>
        </ol>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 space-y-1">
        <div className="font-semibold">Local Testing Note:</div>
        <div>
          When testing on an <b>Android Emulator</b>, use <code>10.0.2.2:3000</code> instead of <code>localhost:3000</code>. On physical devices, use your computer's local IP (e.g. <code>192.168.x.x:3000</code>) and bind your dev servers to <code>0.0.0.0</code>.
        </div>
      </div>
      
      <CodeBlock
        code={`import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class SupportHubChatModal extends StatefulWidget {
  final String channelId;
  final String? profileId;
  final String? userName;

  const SupportHubChatModal({
    Key? key,
    required this.channelId,
    this.profileId,
    this.userName,
  }) : super(key: key);

  @override
  State<SupportHubChatModal> createState() => _SupportHubChatModalState();
}

class _SupportHubChatModalState extends State<SupportHubChatModal> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    // Use 10.0.2.2 for Android Emulators
    final uri = Uri.http('10.0.2.2:3000', '/widget', {
      'channelId': widget.channelId,
      if (widget.profileId != null) 'profileId': widget.profileId,
      if (widget.userName != null) 'name': widget.userName,
    });

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live Support')),
      body: WebViewWidget(controller: controller),
    );
  }
}`}
      />
      
      <div className="mt-4">
        <h4 className="font-semibold text-slate-800">Dynamic User Session Updates</h4>
        <p className="mt-1 text-slate-600 mb-2">If you need to identify the user dynamically <i>after</i> the WebView has already loaded, dispatch a message to the WebView:</p>
        <CodeBlock
          code={`controller.runJavaScript('''
  window.postMessage({
    type: 'supporthub-set-user',
    profileId: 'USER_123',
    name: 'Jane Doe'
  }, '*');
''');`}
        />
      </div>
    </div>
  );
}

export function WebhookDocs() {
  return (
    <div className="p-5 space-y-5 text-sm text-slate-700">
      <div>
        <h3 className="font-semibold text-lg text-slate-900">Webhook Event Notifications</h3>
        <p className="mt-1 text-slate-600">
          SupportHub dispatches real-time HTTPS POST webhooks whenever a new customer message is created or updated.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">Backend implementation steps</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Create a public HTTPS endpoint in your backend to receive SupportHub webhook events.</li>
          <li>Add that endpoint URL in Project Settings &gt; Webhook.</li>
          <li>Copy the webhook signing secret and verify every incoming webhook request.</li>
          <li>When a customer message arrives, run your bot, AI, CRM, or ticket workflow.</li>
          <li>Reply to the conversation using the integration REST API and <code>x-integration-secret</code>.</li>
          <li>If the user asks for a human agent, include <code>status: "OPEN"</code> and <code>assignedTo: "human"</code> in your bot reply payload.</li>
        </ol>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
        <h4 className="font-semibold text-slate-800">1. Setup Webhook Endpoint in Settings</h4>
        <p className="text-xs text-slate-600">
          Go to <b>Project Settings &gt; Webhook</b>, enter your server URL (e.g. <code>https://your-bot-server.com/api/supporthub-webhook</code>), and copy your <b>Signing Secret</b>. Use the signing secret only for verifying incoming webhooks.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
        <h4 className="font-semibold text-slate-800">2. Configure Bot Environment</h4>
        <p className="text-xs text-slate-600">
          Go to <b>Project Settings &gt; Integration</b> and copy the <b>Integration key</b> and <b>Integration secret</b>. Use these only when your bot sends replies or status updates back to SupportHub.
        </p>
        <CodeBlock
          code={`SUPPORT_HUB_BASE_URL=http://localhost:4000
SUPPORT_HUB_INTEGRATION_KEY=YOUR_INTEGRATION_KEY
SUPPORT_HUB_INTEGRATION_SECRET=YOUR_INTEGRATION_SECRET
SUPPORT_HUB_WEBHOOK_SIGNING_SECRET=YOUR_WEBHOOK_SIGNING_SECRET`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">3. Sample Webhook Payload (Event: <code>message.created</code>)</h4>
        <CodeBlock
          code={`POST https://your-bot-server.com/api/supporthub-webhook
Headers:
  Content-Type: application/json
  x-supporthub-event: message.created
  x-supporthub-event-id: 1234
  x-supporthub-timestamp: 2026-08-26T14:30:00.000Z
  x-supporthub-signature: sha256_hex_hmac_signature

Body:
{
  "id": "1234",
  "event": "message.created",
  "projectId": "proj_abc123",
  "createdAt": "2026-08-26T14:30:00.000Z",
  "message_type": "incoming",
  "content": "Hello, I want to book an appointment",
  "conversation": {
    "id": "conv_xyz789",
    "status": "pending"
  },
  "data": {
    "id": "msg_456",
    "conversationId": "conv_xyz789",
    "content": "Hello, I want to book an appointment",
    "senderType": "CUSTOMER",
    "createdAt": "2026-08-26T14:30:00.000Z"
  }
}`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">4. Verifying Webhook Signatures (Node.js Example)</h4>
        <CodeBlock
          code={`import crypto from 'crypto';

export function verifySupportHubSignature(secret, eventId, timestamp, body, signature) {
  const message = \`\${eventId}.\${timestamp}.\${JSON.stringify(body)}\`;
  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return expected === signature;
}`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">5. Webhook Handler Pattern</h4>
        <CodeBlock
          code={`import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const supportHubBaseUrl = process.env.SUPPORT_HUB_BASE_URL;
const integrationKey = process.env.SUPPORT_HUB_INTEGRATION_KEY;
const integrationSecret = process.env.SUPPORT_HUB_INTEGRATION_SECRET;
const signingSecret = process.env.SUPPORT_HUB_WEBHOOK_SIGNING_SECRET;

function verifySupportHubSignature(eventId, timestamp, body, signature) {
  const message = \`\${eventId}.\${timestamp}.\${JSON.stringify(body)}\`;
  const expected = crypto.createHmac('sha256', signingSecret).update(message).digest('hex');
  return expected === signature;
}

async function sendBotReply(conversationId, content, options, status, assignedTo) {
  return fetch(\`\${supportHubBaseUrl}/integrations/\${integrationKey}/conversations/\${conversationId}/messages\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-integration-secret': integrationSecret
    },
    body: JSON.stringify({
      senderType: 'BOT',
      content,
      options,
      status,
      assignedTo
    })
  });
}

app.post('/api/supporthub-webhook', async (req, res) => {
  const eventId = req.header('x-supporthub-event-id');
  const timestamp = req.header('x-supporthub-timestamp');
  const signature = req.header('x-supporthub-signature');

  if (!verifySupportHubSignature(eventId, timestamp, req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  if (req.body.event !== 'message.created' || req.body.data?.senderType !== 'CUSTOMER') {
    return res.json({ ok: true });
  }

  const conversationId = req.body.conversation.id;
  const customerMessage = req.body.content;

  if (customerMessage.toLowerCase().includes('agent')) {
    await sendBotReply(conversationId, 'Transferring you to an agent...', [], 'OPEN', 'human');
  } else {
    await sendBotReply(conversationId, 'Sure, please choose an option:', [
      { title: 'Book Appointment', value: 'book_appointment' },
      { title: 'Talk to Human Agent', value: 'agent' }
    ]);
  }

  return res.json({ ok: true });
});

app.listen(3001);`}
        />
      </div>
    </div>
  );
}

export function ApiDocs() {
  return (
    <div className="p-5 space-y-5 text-sm text-slate-700">
      <div>
        <h3 className="font-semibold text-lg text-slate-900">AI Bot & Agent Reply REST API</h3>
        <p className="mt-1 text-slate-600">
          When your webhook receives a customer message, your AI engine (or external bot) can immediately post an automated reply back to the user with text and interactive quick-reply buttons.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">Backend API implementation steps</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Copy the Integration key and Integration secret from Project Settings &gt; Integration.</li>
          <li>Store the Integration secret only in your backend environment variables.</li>
          <li>Use the Integration key in the REST API URL.</li>
          <li>Send the Integration secret in the <code>x-integration-secret</code> header.</li>
          <li>Use the bot reply endpoint to send automated answers, optional quick-reply buttons, and status updates (for human handoff).</li>
        </ol>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">Send Bot Reply (with optional interactive buttons)</h4>
        <CodeBlock
          code={`POST http://localhost:4000/integrations/:integrationKey/conversations/:conversationId/messages
Headers:
  Content-Type: application/json
  x-integration-secret: YOUR_INTEGRATION_SECRET

Body:
{
  "senderType": "BOT",
  "content": "Sure, please choose a service below:",
  "options": [
    { "title": "General Consultation", "value": "Consultation" },
    { "title": "Follow-up", "value": "Follow-up" },
    { "title": "Talk to Human Agent", "value": "agent" }
  ],
  "status": "OPEN",
  "assignedTo": "human"
}`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">cURL Example</h4>
        <CodeBlock
          code={`curl -X POST "http://localhost:4000/integrations/YOUR_INTEGRATION_KEY/conversations/CONVERSATION_ID/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-integration-secret: YOUR_INTEGRATION_SECRET" \\
  -d '{
    "senderType": "BOT",
    "content": "Hello! How can we assist you today?"
  }'`}
        />
      </div>


      <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 space-y-2">
        <div className="font-semibold">Conversation and ticket status guide:</div>
        <div>For human handoff, include <code>{"\"status\": \"OPEN\", \"assignedTo\": \"human\""}</code> in your bot reply message payload.</div>
        <div>When a ticket is newly raised, the ticket starts as <code>OPEN</code>. Ticket status is then managed in SupportHub as <code>ASSIGNED</code>, <code>IN_PROGRESS</code>, <code>WAITING</code>, <code>RESOLVED</code>, or <code>CLOSED</code>.</div>
        <div>The API modifies the conversation status, not the ticket status directly, though it triggers a ticket creation if needed.</div>
      </div>

      <div className="rounded-md border border-teal-200 bg-teal-50/50 p-4 text-xs text-teal-900 space-y-1">
        <div className="font-semibold">Which ID goes where:</div>
        <div>
          Use the <code>Widget channel ID</code> only in <code>data-channel-id</code>. Use the <code>Integration key</code> in the REST API URL, and send the <code>Integration secret</code> in <code>x-integration-secret</code>.
        </div>
      </div>

      <div className="rounded-md border border-teal-200 bg-teal-50/50 p-4 text-xs text-teal-900 space-y-1">
        <div className="font-semibold">Interactive Button Support:</div>
        <div>
          When you include the <code>options</code> array, buttons will be rendered in the chatbot widget. Clicking any option automatically sends that reply back to SupportHub.
        </div>
      </div>
    </div>
  );
}
