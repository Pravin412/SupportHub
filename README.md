# SupportHub

SupportHub is a centralized multi-project customer support MVP. It combines an admin dashboard, an embeddable customer chat widget, ticket tracking, webhook automation, bot replies, realtime updates, and queued email/webhook delivery in one pnpm Turborepo monorepo.

## Architecture

- `apps/frontend`: Next.js App Router dashboard and embeddable `/widget` experience.
- `apps/backend`: NestJS API running on Fastify.
- `packages/ui`: Shared React UI primitives used by the frontend.
- `packages/shared-types`: Shared TypeScript types.
- PostgreSQL stores users, projects, widget channels, contacts, conversations, messages, tickets, webhooks, and email notification settings.
- Prisma is the backend ORM and migration layer.
- Socket.IO publishes realtime dashboard/widget updates for conversations and messages.
- Redis + BullMQ process webhook delivery and email notification jobs outside the request path.
- Nodemailer sends SMTP email notifications, or logs email jobs locally when `EMAIL_PROVIDER="log"`.

## Core Data Model

- **Project**: Tenant boundary for one customer/support workspace. Each project has dashboard members, integration credentials, widget settings, webhook settings, and notification settings.
- **WidgetChannel**: Public widget configuration. External apps use its `channelId` to load the chat widget.
- **Contact**: A customer identity inside a project, keyed by the external app's stable user ID.
- **Conversation**: Live chat thread linked to a contact and project.
- **Message**: Customer, agent, bot, or system message inside a conversation.
- **Ticket**: Follow-up work item linked to a conversation, with priority and assignment.
- **WebhookDelivery / EmailNotification**: Queued delivery records for outbound automation and notifications.

## Office Developer Integration Summary

Use the frontend widget URL for customer chat and the backend integration API for server-side automation.

- **Widget channel ID** is used only by the customer widget.
- **Integration key** identifies the project for REST automation endpoints.
- **Integration secret** must be sent in the `x-integration-secret` header for integration API calls.
- **Webhook signing secret** is only for verifying outbound webhook requests sent by SupportHub to your server.

Do not expose the integration secret or webhook signing secret in browser or mobile app code.

## Verified Versions

- pnpm: `10.29.3`
- Next.js registry latest checked during implementation: `16.3.1`
- Other package versions are pinned as stable semver ranges in each package manifest and resolved by `pnpm-lock.yaml`.

## Development

```bash
pnpm install
docker compose up -d
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate
pnpm --filter backend seed
pnpm dev
```

On Windows PowerShell, use `pnpm.cmd` if `pnpm` is blocked by execution policy:

```powershell
pnpm.cmd install
docker compose up -d
pnpm.cmd --filter backend prisma:generate
pnpm.cmd --filter backend prisma:migrate
pnpm.cmd --filter backend seed
pnpm.cmd dev
```

## URLs

- Frontend dashboard/widget: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Prisma Studio: `http://localhost:5555`

Flutter/WebView should open the frontend widget URL, not the backend API URL.

## Web Widget Integration

Browser apps can embed the widget script and pass the widget channel plus the logged-in user's stable profile data:

```html
<script
  src="http://localhost:3000/widget.js"
  data-channel-id="YOUR_WIDGET_CHANNEL_ID"
  data-api-url="http://localhost:4000"
  data-profile-id="USER_123"
  data-name="John Doe"
  data-email="john@example.com"
  data-number="+15551234567"
  async
></script>
```

If the user profile is loaded after the widget script, update the session from frontend code:

```js
window.SupportHub?.setUser?.("USER_123", {
  name: "John Doe",
  email: "john@example.com",
  number: "+15551234567"
});
```

## Mobile App Integration & Local Testing

When integrating the SupportHub widget into a mobile app (e.g., Flutter WebView) during local development, note that `localhost` on a mobile device refers to the device itself.

- **Android Emulator**: Use `http://10.0.2.2:3000` instead of `http://localhost:3000`. The frontend widget will automatically adapt and route API requests to `10.0.2.2:4000`.
- **Physical Devices / iOS Simulator**: Run the Next.js and NestJS servers listening on all network interfaces (e.g. by setting host to `0.0.0.0`) and use `http://<your-local-ip>:3000` in the WebView.

**User Session Injection in WebViews:**
If you load the `/widget` URL directly into a WebView, the global `window.SupportHub` script wrapper is not present. 

1. **Initial Load (Recommended):** You can seamlessly initialize a logged-in user by passing the user metadata as URL query parameters when loading the WebView:
   ```dart
   final uri = Uri.http('10.0.2.2:3000', '/widget', {
     'channelId': 'your_channel_id',
     'profileId': 'USER_123',
     'name': 'John Doe',
     'email': 'john@example.com',
     'number': '+15551234567',
   });
   ```

The same query parameters work for any mobile WebView:

```text
http://localhost:3000/widget?channelId=YOUR_WIDGET_CHANNEL_ID&profileId=USER_123&name=John+Doe&email=john@example.com&number=+15551234567
```

2. **Dynamic Update:** To update user session data dynamically *after* the widget has already loaded, execute a `postMessage` event inside the WebView:
   ```dart
   controller.runJavaScript('''
     window.postMessage({
       type: 'supporthub-set-user',
       profileId: 'USER_123',
       name: 'John Doe',
       email: 'john@example.com'
     }, '*');
   ''');
   ```

## Backend Integration API

External backend services, bots, and automation workers can call these endpoints:

```text
POST /integrations/:projectKey/messages
POST /integrations/:projectKey/conversations/:conversationId/messages
POST /integrations/:projectKey/conversations/:conversationId/status
```

`:projectKey` can be the project key, integration key, or project ID. Every request must include:

```text
x-integration-secret: YOUR_INTEGRATION_SECRET
```

### Ingest Customer Message

```http
POST http://localhost:4000/integrations/YOUR_INTEGRATION_KEY/messages
Content-Type: application/json
x-integration-secret: YOUR_INTEGRATION_SECRET

{
  "externalUserId": "USER_123",
  "content": "Hello, I need help",
  "externalMessageId": "optional_unique_message_id",
  "name": "John Doe",
  "email": "john@example.com",
  "number": "+15551234567"
}
```

### Send Bot Reply

```http
POST http://localhost:4000/integrations/YOUR_INTEGRATION_KEY/conversations/CONVERSATION_ID/messages
Content-Type: application/json
x-integration-secret: YOUR_INTEGRATION_SECRET

{
  "senderType": "BOT",
  "content": "Sure, please choose an option:",
  "options": [
    { "title": "Book Appointment", "value": "book_appointment" },
    { "title": "Talk to Human Agent", "value": "agent" }
  ]
}
```

### Update Conversation Status

```http
POST http://localhost:4000/integrations/YOUR_INTEGRATION_KEY/conversations/CONVERSATION_ID/status
Content-Type: application/json
x-integration-secret: YOUR_INTEGRATION_SECRET

{
  "status": "OPEN",
  "assignedTo": "human"
}
```

When `assignedTo` is `"human"`, the conversation automation mode changes to human handoff.

## Webhooks

SupportHub queues outbound webhook events with BullMQ. When a message is created, the backend queues `message.created` for the project's configured webhook URL.

Webhook requests include event metadata and an HMAC signature header so the receiving server can verify the request with the webhook signing secret configured in Project Settings.

## Status Values

Conversation statuses:

- `OPEN`
- `PENDING`
- `SNOOZED`
- `RESOLVED`

Ticket statuses:

- `OPEN`
- `IN_PROGRESS`
- `ASSIGNED`
- `WAITING`
- `RESOLVED`
- `CLOSED`

Ticket priorities:

- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

## Commands

Root commands:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm format:check
```

App commands:

```bash
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend start
pnpm --filter frontend typecheck
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend start
pnpm --filter backend typecheck
pnpm --filter backend test
```

Prisma commands:

```bash
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate
pnpm --filter backend seed
pnpm --filter backend exec prisma studio
```

Equivalent `npx` commands from the repository root:

```bash
npx prisma generate --schema apps/backend/prisma/schema.prisma
npx prisma migrate dev --schema apps/backend/prisma/schema.prisma
npx prisma studio --schema apps/backend/prisma/schema.prisma
```

Development login:

- Email: `admin@gmail.com`
- Password: `Password@123`

The seed only creates the admin user. Create projects from the dashboard after login.

## Environment

Copy `.env.example` to `.env` at the repository root and configure values as needed. The backend can also use `apps/backend/.env`.

SMTP email sending uses Nodemailer directly:

```ini
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="smtp-user@example.com"
SMTP_PASSWORD="<gmail-app-password>"
BCC_EMAIL="notifications@example.com"
```

Use `EMAIL_PROVIDER="log"` to print email jobs in the backend logs without sending real email.

Ticket notification recipients are configured per project in Project Settings > Ticket Emails.

## Security Notes

Dashboard refresh tokens are stored in HttpOnly cookies. Access tokens stay in memory only and are never written to localStorage or sessionStorage. Project-scoped dashboard queries verify membership on the backend, and integration message ingress authenticates with the project integration secret rather than trusting a project ID.
