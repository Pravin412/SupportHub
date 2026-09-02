ALTER TABLE "Project" ADD COLUMN "integrationSecret" TEXT;

UPDATE "Project"
SET "integrationSecret" = 'sh_' || md5(random()::text || clock_timestamp()::text || "id")
WHERE "integrationSecret" IS NULL;

ALTER TABLE "Project" ALTER COLUMN "integrationSecret" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "integrationSecretHash" DROP NOT NULL;
