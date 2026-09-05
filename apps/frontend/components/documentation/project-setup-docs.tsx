import { CodeBlock } from "./code-block";

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
          code={`Widget channel ID usage:\n\nWeb script:\ndata-channel-id="YOUR_WIDGET_CHANNEL_ID"\n\nMobile WebView:\n/widget?channelId=YOUR_WIDGET_CHANNEL_ID&profileId=USER_123`}
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
          code={`Example webhook URL:\nhttps://your-backend.com/api/supporthub-webhook\n\nSecret usage:\nSUPPORT_HUB_WEBHOOK_SIGNING_SECRET=YOUR_WEBHOOK_SIGNING_SECRET`}
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
          code={`SUPPORT_HUB_BASE_URL=http://localhost:4000\nSUPPORT_HUB_INTEGRATION_KEY=YOUR_INTEGRATION_KEY\nSUPPORT_HUB_INTEGRATION_SECRET=YOUR_INTEGRATION_SECRET`}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">6. Configure ticket email notifications</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Open <b>Project Settings &gt; Project Access</b>.</li>
          <li>When adding or editing a project admin or project agent, enable <b>Receive ticket email notifications</b> only for staff who should get ticket emails.</li>
          <li>Open <b>Project Settings &gt; Ticket Emails</b>.</li>
          <li>Add only extra recipient emails that are not managed as project admins or project agents.</li>
          <li>If a project access user's email is also in the extra recipient list, their Project Access notification toggle still controls whether they receive ticket emails.</li>
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
