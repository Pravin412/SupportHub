-- CreateTable
CREATE TABLE "WidgetChannel" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hi, welcome in. How can we help?',
    "launcherPosition" TEXT NOT NULL DEFAULT 'RIGHT',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WidgetChannel_pkey" PRIMARY KEY ("id")
);

-- Backfill one website widget channel for every existing project.
INSERT INTO "WidgetChannel" ("id", "projectId", "publicId", "name", "updatedAt")
SELECT
    'wch_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
    "id",
    'ch_' || substr(regexp_replace("key", '[^a-z0-9]', '', 'g'), 1, 12) || '_' || substr(md5(random()::text || "id"), 1, 6),
    "name" || ' Website',
    CURRENT_TIMESTAMP
FROM "Project"
WHERE NOT EXISTS (
    SELECT 1 FROM "WidgetChannel" WHERE "WidgetChannel"."projectId" = "Project"."id"
);

-- CreateIndex
CREATE UNIQUE INDEX "WidgetChannel_projectId_key" ON "WidgetChannel"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "WidgetChannel_publicId_key" ON "WidgetChannel"("publicId");

-- AddForeignKey
ALTER TABLE "WidgetChannel" ADD CONSTRAINT "WidgetChannel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
