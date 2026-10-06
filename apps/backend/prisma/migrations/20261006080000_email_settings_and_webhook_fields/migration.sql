-- CreateTable
CREATE TABLE "ProjectEmailSettings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "smtpUser" TEXT NOT NULL,
    "smtpPassword" TEXT NOT NULL,
    "fromName" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProjectEmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEmailSettings_projectId_key" ON "ProjectEmailSettings"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectEmailSettings" ADD CONSTRAINT "ProjectEmailSettings_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "Webhook_projectId_key";

-- AlterTable
ALTER TABLE "Webhook"
    ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Webhook',
    ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Webhook_projectId_isActive_idx" ON "Webhook"("projectId", "isActive");
