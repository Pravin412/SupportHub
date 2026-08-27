"use client";
import { BookOpen, Smartphone, Terminal, Users, Webhook, KeyRound, ArrowRight, ShieldCheck, Check, Copy } from "lucide-react";
import { Button } from "@support-hub/ui";
import { useState } from "react";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<"nextjs" | "flutter" | "webhook" | "api">("nextjs");

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
          <BookOpen size={20} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">SupportHub Integration Guides & Docs</h1>
          <p className="text-sm text-slate-500">Comprehensive guides for Next.js, Mobile Flutter, Webhooks, and AI Bot REST API integration.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <TabButton active={activeTab === "nextjs"} onClick={() => setActiveTab("nextjs")} icon={<Terminal size={16} />}>Next.js / React</TabButton>
        <TabButton active={activeTab === "flutter"} onClick={() => setActiveTab("flutter")} icon={<Smartphone size={16} />}>Flutter / Mobile</TabButton>
        <TabButton active={activeTab === "webhook"} onClick={() => setActiveTab("webhook")} icon={<Webhook size={16} />}>Webhooks & Automation</TabButton>
        <TabButton active={activeTab === "api"} onClick={() => setActiveTab("api")} icon={<KeyRound size={16} />}>Bot Reply REST API</TabButton>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {activeTab === "nextjs" && <NextjsDocs />}
        {activeTab === "flutter" && <FlutterDocs />}
        {activeTab === "webhook" && <WebhookDocs />}
        {activeTab === "api" && <ApiDocs />}
      </div>
      
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-slate-700" />
          <h2 className="text-lg font-semibold">User Identification & Visitor Sessions</h2>
        </div>
        <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm text-sm text-slate-700 space-y-4">
          <p>
            When a user logs into your application, you can pass their logged-in user profile to the SupportHub widget so all messages attach to their contact record in your inbox.
          </p>
          <CodeBlock
            code={`// Call this in your frontend code after login
if (window.SupportHub) {
  window.SupportHub.setUser('user_12345', {
    name: 'Jane Doe',
    number: '+15551234567'
  });
}`}
          />
          <p className="text-xs text-slate-500">
            <code>profileId</code> (first argument) is required and should be your application's unique user ID. <code>name</code> and <code>number</code> are optional.
          </p>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
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

function TabButton({ children, active, onClick, icon }: any) {
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

function NextjsDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Next.js / React Integration</h3>
      <p>In Next.js App Router (<code>app/layout.tsx</code>), import the <code>next/script</code> component:</p>
      
      <CodeBlock
        code={`import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* SupportHub Floating Widget */}
        <Script
          id="supporthub-script"
          src="http://localhost:3000/widget.js"
          strategy="lazyOnload"
          data-channel-id="YOUR_PROJECT_CHANNEL_ID"
        />
      </body>
    </html>
  );
}`}
      />
    </div>
  );
}

function FlutterDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Flutter Mobile Integration</h3>
      <p>In Flutter apps, use the <code>webview_flutter</code> package to open the chat interface full-screen or in a bottom sheet modal.</p>
      
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
    final uri = Uri.http('localhost:3000', '/widget', {
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
    </div>
  );
}

function WebhookDocs() {
  return (
    <div className="p-5 space-y-5 text-sm text-slate-700">
      <div>
        <h3 className="font-semibold text-lg text-slate-900">Webhook Event Notifications</h3>
        <p className="mt-1 text-slate-600">
          SupportHub dispatches real-time HTTPS POST webhooks whenever a new customer message is created or updated.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
        <h4 className="font-semibold text-slate-800">1. Setup Webhook Endpoint in Settings</h4>
        <p className="text-xs text-slate-600">
          Go to <b>Project Settings &gt; Webhook</b>, enter your server URL (e.g. <code>https://your-bot-server.com/api/supporthub-webhook</code>), and copy your <b>Signing Secret</b>.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">2. Sample Webhook Payload (Event: <code>message.created</code>)</h4>
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
        <h4 className="font-semibold text-slate-800">3. Verifying Webhook Signatures (Node.js Example)</h4>
        <CodeBlock
          code={`import crypto from 'crypto';

export function verifySupportHubSignature(secret, eventId, timestamp, body, signature) {
  const message = \`\${eventId}.\${timestamp}.\${JSON.stringify(body)}\`;
  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return expected === signature;
}`}
        />
      </div>
    </div>
  );
}

function ApiDocs() {
  return (
    <div className="p-5 space-y-5 text-sm text-slate-700">
      <div>
        <h3 className="font-semibold text-lg text-slate-900">AI Bot & Agent Reply REST API</h3>
        <p className="mt-1 text-slate-600">
          When your webhook receives a customer message, your AI engine (or external bot) can immediately post an automated reply back to the user with text and interactive quick-reply buttons.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">Send Bot Reply (with optional interactive buttons)</h4>
        <CodeBlock
          code={`POST http://localhost:4000/integrations/:projectKey/conversations/:conversationId/messages
Headers:
  Content-Type: application/json
  x-integration-secret: YOUR_PROJECT_INTEGRATION_SECRET

Body:
{
  "senderType": "BOT",
  "content": "Sure, please choose a service below:",
  "options": [
    { "title": "General Consultation", "value": "Consultation" },
    { "title": "Follow-up", "value": "Follow-up" },
    { "title": "Talk to Human Agent", "value": "agent" }
  ]
}`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">cURL Example</h4>
        <CodeBlock
          code={`curl -X POST "http://localhost:4000/integrations/YOUR_PROJECT_KEY/conversations/CONVERSATION_ID/messages" \\
  -H "Content-Type: application/json" \\
  -H "x-integration-secret: YOUR_INTEGRATION_SECRET" \\
  -d '{
    "senderType": "BOT",
    "content": "Hello! How can we assist you today?"
  }'`}
        />
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

