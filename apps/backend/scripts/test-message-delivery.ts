import assert from "node:assert/strict";
import { CoreService } from "../src/features/support/support.service";

async function main() {
  const service = Object.create(CoreService.prototype) as any;
  const events: any[] = [];
  service.realtime = {
    emitProject: (...args: any[]) => events.push(args),
    emitConversation: (...args: any[]) => events.push(args)
  };
  const message = { id: "reply", conversationId: "chat", status: "SENT" };
  service.prisma = {
    widgetChannel: { findUnique: async () => ({ projectId: "project", enabled: true }) },
    message: {
      findMany: async ({ where }: any) => {
        assert.equal(where.conversation.contact.externalUserId, "customer");
        assert.equal(where.conversation.projectId, "project");
        assert.deepEqual(where.senderType.in, ["AGENT", "BOT"]);
        return message.status === "SENT" ? [message] : [];
      },
      updateMany: async ({ data }: any) => { assert.equal(data.status, "DELIVERED"); return { count: 1 }; }
    }
  };
  await service.widgetDelivered("channel", "customer", ["reply"]);
  assert.equal(message.status, "DELIVERED");
  assert.equal(events.length, 2);
  await service.widgetDelivered("channel", "customer", ["reply"]);
  assert.equal(events.length, 2);
  console.log("Delivery acknowledgement scope and idempotency checks passed.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
