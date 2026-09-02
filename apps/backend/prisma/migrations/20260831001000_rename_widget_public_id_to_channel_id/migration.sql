ALTER TABLE "WidgetChannel" RENAME COLUMN "publicId" TO "channelId";

ALTER INDEX "WidgetChannel_publicId_key" RENAME TO "WidgetChannel_channelId_key";
