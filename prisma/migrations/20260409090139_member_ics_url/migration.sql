/*
  Warnings:

  - You are about to drop the column `icsContent` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `icsFileName` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "icsContent",
DROP COLUMN "icsFileName",
ADD COLUMN     "displayOrder" INTEGER,
ADD COLUMN     "icsUrl" TEXT;
