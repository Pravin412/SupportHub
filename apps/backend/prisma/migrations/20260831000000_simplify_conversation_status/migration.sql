UPDATE "Conversation"
SET "status" = 'OPEN'
WHERE "status" IN ('WAITING_FOR_HUMAN', 'WAITING_FOR_CUSTOMER', 'ASSIGNED');

UPDATE "Conversation"
SET "status" = 'RESOLVED'
WHERE "status" = 'CLOSED';

ALTER TYPE "ConversationStatus" RENAME TO "ConversationStatus_old";

CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'PENDING', 'SNOOZED', 'RESOLVED');

ALTER TABLE "Conversation"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Conversation"
ALTER COLUMN "status" TYPE "ConversationStatus"
USING "status"::text::"ConversationStatus";

ALTER TABLE "Conversation"
ALTER COLUMN "status" SET DEFAULT 'OPEN';

DROP TYPE "ConversationStatus_old";
