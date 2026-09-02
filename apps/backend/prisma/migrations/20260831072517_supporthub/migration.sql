-- AlterTable
ALTER TABLE "BotConfiguration" ADD COLUMN     "botAvatar" TEXT;

-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "secret" TEXT;

-- AlterTable
ALTER TABLE "WidgetChannel" ADD COLUMN     "colorTheme" TEXT NOT NULL DEFAULT '#0f4c42',
ADD COLUMN     "logoUrl" TEXT;
