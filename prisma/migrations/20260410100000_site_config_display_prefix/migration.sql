-- 表示名は「表示名」のみ保持。末尾の "CommuHub"（前に空白があってもなくても）を除去して正規化する。
UPDATE "SiteConfig"
SET "displayName" = TRIM(
  REGEXP_REPLACE(TRIM("displayName"), '\s*CommuHub\s*$', '', 'i')
);

-- 空（旧データが全体 "CommuHub" だけだった場合など）は既定の表示名へ
UPDATE "SiteConfig"
SET "displayName" = 'PonzRyu'
WHERE TRIM(COALESCE("displayName", '')) = '';

ALTER TABLE "SiteConfig" ALTER COLUMN "displayName" SET DEFAULT 'PonzRyu';
