-- CreateTable
CREATE TABLE "ProjectWhatsappSettings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ticketCreatedEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recipientPhoneNumbers" TEXT NOT NULL DEFAULT '',
    "ticketCreatedTemplateId" TEXT,
    "providerUrl" TEXT,
    "vendorId" TEXT,
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectWhatsappSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectWhatsappTemplate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en_US',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectWhatsappTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappNotification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWhatsappSettings_projectId_key" ON "ProjectWhatsappSettings"("projectId");

-- CreateIndex
CREATE INDEX "ProjectWhatsappTemplate_projectId_idx" ON "ProjectWhatsappTemplate"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWhatsappTemplate_projectId_name_key" ON "ProjectWhatsappTemplate"("projectId", "name");

-- CreateIndex
CREATE INDEX "WhatsappNotification_projectId_createdAt_idx" ON "WhatsappNotification"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProjectWhatsappSettings" ADD CONSTRAINT "ProjectWhatsappSettings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWhatsappTemplate" ADD CONSTRAINT "ProjectWhatsappTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
