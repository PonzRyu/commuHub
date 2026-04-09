-- AlterTable
ALTER TABLE "Member" ADD COLUMN "icsRegisteredAt" TIMESTAMP(3);

-- 既存データ: .ics がある行は更新日時を登録日の近似として埋める
UPDATE "Member"
SET "icsRegisteredAt" = "updatedAt"
WHERE "icsContent" IS NOT NULL;
