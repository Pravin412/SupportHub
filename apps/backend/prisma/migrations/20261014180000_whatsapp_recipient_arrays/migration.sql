ALTER TABLE "ProjectWhatsappSettings"
  ALTER COLUMN "recipientPhoneNumbers" DROP DEFAULT,
  ALTER COLUMN "recipientPhoneNumbers" TYPE TEXT[]
    USING CASE
      WHEN btrim("recipientPhoneNumbers") = '' THEN ARRAY[]::TEXT[]
      ELSE regexp_split_to_array(btrim("recipientPhoneNumbers"), '[[:space:],;]+')
    END,
  ALTER COLUMN "recipientPhoneNumbers" SET DEFAULT ARRAY[]::TEXT[];
