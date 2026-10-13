import assert from "node:assert/strict";
import { MessageRetentionProcessor } from "../src/common/queue/message-retention.processor";

async function main() {
  const originalNow = Date.now;
  const now = new Date("2026-10-13T12:00:00Z").getTime();
  Date.now = () => now;
  const cutoff = now - 30 * 24 * 60 * 60 * 1000;
  let rows = [
    { id: "old", createdAt: cutoff - 1 },
    { id: "boundary", createdAt: cutoff },
    { id: "recent", createdAt: now }
  ];
  const detached: string[] = [];
  const jobs: any[] = [];
  const prisma = {
    message: {
      findMany: async ({ where, take }: any) => rows
        .filter((row) => row.createdAt < where.createdAt.lt.getTime())
        .slice(0, take)
    },
    $transaction: async (callback: any) => callback({
      attachment: {
        updateMany: async ({ where, data }: any) => {
          assert.equal(data.messageId, null);
          detached.push(...where.messageId.in);
        }
      },
      message: {
        deleteMany: async ({ where }: any) => {
          const before = rows.length;
          rows = rows.filter((row) => !where.id.in.includes(row.id));
          return { count: before - rows.length };
        }
      }
    })
  };
  const queue = { add: async (...args: any[]) => { jobs.push(args); } };
  try {
    const processor = new MessageRetentionProcessor(prisma as any, queue as any);
    await processor.onModuleInit();
    assert.equal(jobs.length, 2);
    assert.equal(jobs[1][2].repeat.every, 60 * 60 * 1000);
    assert.deepEqual(await processor.process(), { deleted: 1 });
    assert.deepEqual(rows.map((row) => row.id), ["boundary", "recent"]);
    assert.deepEqual(detached, ["old"]);
    assert.deepEqual(await processor.process(), { deleted: 0 });
    rows = Array.from({ length: 501 }, (_, index) => ({ id: `old-${index}`, createdAt: cutoff - 1 }));
    assert.deepEqual(await processor.process(), { deleted: 501 });
    assert.equal(rows.length, 0);
    console.log("Message retention checks passed.");
  } finally {
    Date.now = originalNow;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
