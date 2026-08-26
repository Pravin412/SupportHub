-- CreateTable
CREATE TABLE "BotConfiguration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "responseMode" "AutomationMode" NOT NULL DEFAULT 'AUTOMATED',
    "botName" TEXT NOT NULL DEFAULT 'Support Bot',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "handoffKeywords" TEXT[] DEFAULT ARRAY['agent', 'human', 'help']::TEXT[],
    "fallbackMessage" TEXT NOT NULL DEFAULT 'Thanks for your message. A support agent will follow up shortly.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotConfiguration_projectId_key" ON "BotConfiguration"("projectId");

-- AddForeignKey
ALTER TABLE "BotConfiguration" ADD CONSTRAINT "BotConfiguration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
