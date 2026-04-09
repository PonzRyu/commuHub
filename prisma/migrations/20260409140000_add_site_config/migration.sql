-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "displayName" TEXT NOT NULL DEFAULT 'CommuHub',

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteConfig" ("id", "displayName") VALUES (1, 'CommuHub');
