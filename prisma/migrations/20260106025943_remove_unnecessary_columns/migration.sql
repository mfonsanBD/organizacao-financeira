/*
  Warnings:

  - You are about to drop the column `familyId` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `incomes` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "categories_familyId_idx";

-- DropIndex
DROP INDEX "expenses_familyId_idx";

-- DropIndex
DROP INDEX "incomes_familyId_idx";

-- DropIndex
DROP INDEX "notifications_familyId_idx";

-- DropIndex
DROP INDEX "users_familyId_idx";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "familyId";

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "familyId";

-- AlterTable
ALTER TABLE "incomes" DROP COLUMN "familyId";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "familyId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "familyId";
