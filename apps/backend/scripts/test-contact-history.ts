import assert from "node:assert/strict";
import { CoreService } from "../src/features/support/support.service";

async function main() {
  const service = Object.create(CoreService.prototype) as any;
  const old = { id: "old", status: "RESOLVED", createdAt: new Date(1), lastMessageAt: new Date(2) };
  const current = { id: "current", status: "PENDING", createdAt: new Date(3), lastMessageAt: new Date(4) };
  let emitted = 0;
  service.assertMember = async () => {};
  service.confirmDelivery = async () => {};
  service.realtime = { emitProject: () => { emitted++; } };
  service.prisma = {
    conversation: {
      findUnique: async () => ({ projectId: "project", contactId: "contact" }),
      updateMany: async ({ where, data }: any) => {
        assert.equal(where.contactId, "contact");
        assert.equal(data.unreadCount, 0);
        return { count: 1 };
      },
      findMany: async (options: any) => {
        assert.deepEqual(options.distinct, ["contactId"]);
        return [];
      }
    },
    message: { findMany: async ({ where }: any) => {
      assert.equal(where.conversation.contactId, "contact");
      return [current, old].map((session) => ({ id: `message-${session.id}`, conversationId: session.id, senderType: "CUSTOMER", status: "SENT", content: session.id, createdAt: session.lastMessageAt, conversation: session }));
    } }
  };
  const history = (await service.messages("admin", "current")).reverse();
  assert.deepEqual(history.map((message: any) => message.content), ["New conversation started", "old", "Conversation ended", "New conversation started", "current"]);
  assert.equal(emitted, 1);
  await service.conversations("admin", "project");
  console.log("Contact history and unread checks passed.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
