ALTER TABLE "ProjectMember"
ADD COLUMN "mobileNumber" TEXT,
ADD COLUMN "whatsappNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
