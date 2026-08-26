"use client";
import { BookOpen, Code2, Smartphone, Terminal, Users } from "lucide-react";
import { Button } from "@central-support/ui";
import { useState } from "react";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<"html" | "nextjs" | "flutter">("html");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
          <BookOpen size={20} />
        </span>
        <div>
          <h1 className="text-xl font-bold">Widget Integration Documentation</h1>
          <p className="text-sm text-slate-500">Learn how to install the SupportHub chat widget into your applications.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <TabButton active={activeTab === "html"} onClick={() => setActiveTab("html")} icon={<Code2 size={16} />}>HTML / Vanilla</TabButton>
        <TabButton active={activeTab === "nextjs"} onClick={() => setActiveTab("nextjs")} icon={<Terminal size={16} />}>Next.js / React</TabButton>
        <TabButton active={activeTab === "flutter"} onClick={() => setActiveTab("flutter")} icon={<Smartphone size={16} />}>Flutter</TabButton>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {activeTab === "html" && <HtmlDocs />}
        {activeTab === "nextjs" && <NextjsDocs />}
        {activeTab === "flutter" && <FlutterDocs />}
      </div>
      
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-slate-700" />
          <h2 className="text-lg font-semibold">Dynamic Visitor Sessions</h2>
        </div>
        <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm text-sm text-slate-700 space-y-4">
          <p>
            When a user logs into your application, you should immediately inform the SupportHub widget so that the chat conversation is linked to their profile. This allows agents to see exactly who they are talking to and automatically loads their past chat history.
          </p>
          <div className="bg-slate-950 text-slate-200 p-4 rounded-md overflow-x-auto">
            <pre><code>{`// Execute this in your frontend after successful login
if (window.SupportHub) {
  window.SupportHub.setUser('user_12345', {
    name: 'Jane Doe',
    number: '+15551234567'
  });
}`}</code></pre>
          </div>
          <p className="text-xs text-slate-500">
            Note: The <code>profileId</code> (first argument) is required. <code>name</code> and <code>number</code> are optional but highly recommended.
          </p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick, icon }: any) {
  return (
    <Button
      onClick={onClick}
      className={`h-auto rounded-none border-0 border-b-2 bg-transparent px-4 py-2 text-sm font-medium shadow-none transition-colors ${
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

function HtmlDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Standard HTML Integration</h3>
      <p>Place this script snippet right before the closing <code>&lt;/body&gt;</code> tag of your application's layout.</p>
      
      <div className="bg-slate-950 text-slate-200 p-4 rounded-md overflow-x-auto">
        <pre><code>{`<script 
  id="supporthub-script"
  src="https://your-supporthub-domain.com/widget.js" 
  data-channel-id="YOUR_PROJECT_CHANNEL_ID"
></script>`}</code></pre>
      </div>
      <p className="text-xs text-slate-500">Replace the URL with your actual deployed SupportHub URL and provide the correct Channel ID.</p>
    </div>
  );
}

function NextjsDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Next.js Integration</h3>
      <p>Next.js handles scripts asynchronously. You must use the <code>next/script</code> component in your root layout (<code>app/layout.tsx</code> or <code>pages/_app.tsx</code>) and <b>must include the id attribute</b>.</p>
      
      <div className="bg-slate-950 text-slate-200 p-4 rounded-md overflow-x-auto">
        <pre><code>{`import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* SupportHub Widget */}
        <Script
          id="supporthub-script"
          src="https://your-supporthub-domain.com/widget.js"
          strategy="lazyOnload"
          data-channel-id="YOUR_PROJECT_CHANNEL_ID"
        />
      </body>
    </html>
  );
}`}</code></pre>
      </div>
    </div>
  );
}

function FlutterDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Flutter Webview Integration</h3>
      <p>For Flutter applications, you can embed the Chat UI directly using the <code>webview_flutter</code> plugin. You bypass the injector script and load the chat interface directly via URL.</p>
      
      <div className="bg-slate-950 text-slate-200 p-4 rounded-md overflow-x-auto">
        <pre><code>{`import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class SupportHubChat extends StatefulWidget {
  final String channelId;
  final String? profileId;
  final String? name;

  const SupportHubChat({Key? key, required this.channelId, this.profileId, this.name}) : super(key: key);

  @override
  State<SupportHubChat> createState() => _SupportHubChatState();
}

class _SupportHubChatState extends State<SupportHubChat> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    
    // Construct the direct iframe URL
    final uri = Uri.https('your-supporthub-domain.com', '/widget', {
      'channelId': widget.channelId,
      if (widget.profileId != null) 'profileId': widget.profileId,
      if (widget.name != null) 'name': widget.name,
    });

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      body: WebViewWidget(controller: controller),
    );
  }
}`}</code></pre>
      </div>
      <p className="text-xs text-slate-500">Note: In Flutter, you pass the dynamic user session directly in the URL query parameters when launching the WebView.</p>
    </div>
  );
}
