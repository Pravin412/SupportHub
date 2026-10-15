"use client";
import { useState } from "react";
import { BookOpen, Settings, Smartphone, Terminal, Users, Webhook, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@support-hub/ui";
import {
  CodeBlock,
  ProjectSetupDocs,
  NextjsDocs,
  FlutterDocs,
  IonicDocs,
  WebhookDocs,
  ApiDocs
} from "./documentation-tabs";

type DocTab = "setup" | "nextjs" | "flutter" | "ionic" | "webhook" | "api";

const docTabs: { id: DocTab; label: string; icon: typeof Settings; Content: () => React.JSX.Element }[] = [
  { id: "setup", label: "Project Setup", icon: Settings, Content: ProjectSetupDocs },
  { id: "nextjs", label: "Next.js / React", icon: Terminal, Content: NextjsDocs },
  { id: "flutter", label: "Flutter / Mobile", icon: Smartphone, Content: FlutterDocs },
  { id: "ionic", label: "Ionic / Capacitor", icon: Smartphone, Content: IonicDocs },
  { id: "webhook", label: "Webhooks & Automation", icon: Webhook, Content: WebhookDocs },
  { id: "api", label: "Bot Reply REST API", icon: KeyRound, Content: ApiDocs }
];

export function DocumentationView() {
  const [activeTab, setActiveTab] = useState<DocTab>("setup");

  return (
    <div className="w-full max-w-5xl xl:max-w-none mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
          <BookOpen size={20} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">SupportHub Integration Guides & Docs</h1>
          <p className="text-sm text-slate-500">Project setup, widget configuration, webhooks, mobile embedding, and bot REST API integration.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocTab)}>
        <TabsList className="w-full overflow-x-auto bg-white/60 p-1 pb-0">
          {docTabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
            >
              <Icon size={16} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {docTabs.map(({ id, Content }) => (
            <TabsContent key={id} value={id} className="m-0">
              <Content />
            </TabsContent>
          ))}
        </div>
      </Tabs>
      
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
