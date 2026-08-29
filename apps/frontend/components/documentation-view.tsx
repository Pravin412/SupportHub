"use client";
import { useState } from "react";
import { BookOpen, Smartphone, Terminal, Users, Webhook, KeyRound } from "lucide-react";
import {
  CodeBlock,
  TabButton,
  NextjsDocs,
  FlutterDocs,
  WebhookDocs,
  ApiDocs
} from "./documentation-tabs";

export function DocumentationView() {
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
    email: 'jane@example.com',
    number: '+15551234567'
  });
}`}
          />
          <p className="text-xs text-slate-500">
            The first argument is required and should be your application's stable unique user ID. <code>name</code>, <code>email</code>, and <code>number</code> are optional.
          </p>
        </div>
      </div>
    </div>
  );
}
