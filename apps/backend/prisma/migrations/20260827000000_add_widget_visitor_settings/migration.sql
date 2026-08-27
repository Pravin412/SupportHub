ALTER TABLE "WidgetChannel" ADD COLUMN "collectVisitorInfo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WidgetChannel" ADD COLUMN "visitorNameEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WidgetChannel" ADD COLUMN "visitorEmailEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WidgetChannel" ADD COLUMN "visitorPhoneEnabled" BOOLEAN NOT NULL DEFAULT false;
