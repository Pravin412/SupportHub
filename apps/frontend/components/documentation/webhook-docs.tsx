import { CodeBlock } from "./code-block";

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
          code={`SUPPORT_HUB_BASE_URL=http://localhost:4000\nSUPPORT_HUB_INTEGRATION_KEY=YOUR_INTEGRATION_KEY\nSUPPORT_HUB_INTEGRATION_SECRET=YOUR_INTEGRATION_SECRET\nSUPPORT_HUB_WEBHOOK_SIGNING_SECRET=YOUR_WEBHOOK_SIGNING_SECRET`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">3. Sample Webhook Payload (Event: <code>message.created</code>)</h4>
        <CodeBlock
          code={`POST https://your-bot-server.com/api/supporthub-webhook\nHeaders:\n  Content-Type: application/json\n  x-supporthub-event: message.created\n  x-supporthub-event-id: 1234\n  x-supporthub-timestamp: 2026-08-26T14:30:00.000Z\n  x-supporthub-signature: sha256_hex_hmac_signature\n\nBody:\n{\n  "id": "1234",\n  "event": "message.created",\n  "projectId": "proj_abc123",\n  "createdAt": "2026-08-26T14:30:00.000Z",\n  "message_type": "incoming",\n  "content": "Hello, I want to book an appointment",\n  "conversation": {\n    "id": "conv_xyz789",\n    "status": "pending"\n  },\n  "data": {\n    "id": "msg_456",\n    "conversationId": "conv_xyz789",\n    "content": "Hello, I want to book an appointment",\n    "senderType": "CUSTOMER",\n    "createdAt": "2026-08-26T14:30:00.000Z"\n  }\n}`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">4. Verifying Webhook Signatures (Node.js Example)</h4>
        <CodeBlock
          code={`import crypto from 'crypto';\n\nexport function verifySupportHubSignature(secret, eventId, timestamp, body, signature) {\n  const message = \`\${eventId}.\${timestamp}.\${JSON.stringify(body)}\`;\n  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');\n  return expected === signature;\n}`}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800">5. Webhook Handler Pattern</h4>
        <CodeBlock
          code={`import express from 'express';\nimport crypto from 'crypto';\n\nconst app = express();\napp.use(express.json());\n\nconst supportHubBaseUrl = process.env.SUPPORT_HUB_BASE_URL;\nconst integrationKey = process.env.SUPPORT_HUB_INTEGRATION_KEY;\nconst integrationSecret = process.env.SUPPORT_HUB_INTEGRATION_SECRET;\nconst signingSecret = process.env.SUPPORT_HUB_WEBHOOK_SIGNING_SECRET;\n\nfunction verifySupportHubSignature(eventId, timestamp, body, signature) {\n  const message = \`\${eventId}.\${timestamp}.\${JSON.stringify(body)}\`;\n  const expected = crypto.createHmac('sha256', signingSecret).update(message).digest('hex');\n  return expected === signature;\n}\n\nasync function sendBotReply(conversationId, content, options, status, assignedTo) {\n  return fetch(\`\${supportHubBaseUrl}/integrations/\${integrationKey}/conversations/\${conversationId}/messages\`, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'x-integration-secret': integrationSecret\n    },\n    body: JSON.stringify({\n      senderType: 'BOT',\n      content,\n      options,\n      status,\n      assignedTo\n    })\n  });\n}\n\napp.post('/api/supporthub-webhook', async (req, res) => {\n  const eventId = req.header('x-supporthub-event-id');\n  const timestamp = req.header('x-supporthub-timestamp');\n  const signature = req.header('x-supporthub-signature');\n\n  if (!verifySupportHubSignature(eventId, timestamp, req.body, signature)) {\n    return res.status(401).json({ error: 'Invalid signature' });\n  }\n\n  if (req.body.event !== 'message.created' || req.body.data?.senderType !== 'CUSTOMER') {\n    return res.json({ ok: true });\n  }\n\n  const conversationId = req.body.conversation.id;\n  const customerMessage = req.body.content;\n\n  if (customerMessage.toLowerCase().includes('agent')) {\n    await sendBotReply(conversationId, 'Transferring you to an agent...', [], 'OPEN', 'human');\n  } else {\n    await sendBotReply(conversationId, 'Sure, please choose an option:', [\n      { title: 'Book Appointment', value: 'book_appointment' },\n      { title: 'Talk to Human Agent', value: 'agent' }\n    ]);\n  }\n\n  return res.json({ ok: true });\n});\n\napp.listen(3001);`}
        />
      </div>
    </div>
  );
}
