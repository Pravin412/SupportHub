import { CodeBlock } from "./code-block";

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
          code={`POST http://localhost:4000/integrations/:integrationKey/conversations/:conversationId/messages\nHeaders:\n  Content-Type: application/json\n  x-integration-secret: YOUR_INTEGRATION_SECRET\n\nBody:\n{\n  "senderType": "BOT",\n  "content": "Sure, please choose a service below:",\n  "options": [\n    { "title": "General Consultation", "value": "Consultation" },\n    { "title": "Follow-up", "value": "Follow-up" },\n    { "title": "Talk to Human Agent", "value": "agent" }\n  ],\n  "status": "OPEN",\n  "assignedTo": "human"\n}`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">cURL Example</h4>
        <CodeBlock
          code={`curl -X POST "http://localhost:4000/integrations/YOUR_INTEGRATION_KEY/conversations/CONVERSATION_ID/messages" \\\n  -H "Content-Type: application/json" \\\n  -H "x-integration-secret: YOUR_INTEGRATION_SECRET" \\\n  -d '{\n    "senderType": "BOT",\n    "content": "Hello! How can we assist you today?"\n  }'`}
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
