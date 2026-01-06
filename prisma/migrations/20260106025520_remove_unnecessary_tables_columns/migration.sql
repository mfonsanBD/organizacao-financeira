/*
  Warnings:

  - You are about to drop the column `recurrence` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `incomes` table. All the data in the column will be lost.
  - You are about to drop the `budgets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `families` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `receivables` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transaction_entries` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `paymentData` to the `incomes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_familyId_fkey";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_familyId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_familyId_fkey";

-- DropForeignKey
ALTER TABLE "incomes" DROP CONSTRAINT "incomes_familyId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_familyId_fkey";

-- DropForeignKey
ALTER TABLE "receivables" DROP CONSTRAINT "receivables_familyId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "transaction_entries" DROP CONSTRAINT "transaction_entries_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "transaction_entries" DROP CONSTRAINT "transaction_entries_createdById_fkey";

-- DropForeignKey
ALTER TABLE "transaction_entries" DROP CONSTRAINT "transaction_entries_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "transaction_entries" DROP CONSTRAINT "transaction_entries_familyId_fkey";

-- DropForeignKey
ALTER TABLE "transaction_entries" DROP CONSTRAINT "transaction_entries_incomeId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_familyId_fkey";

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "recurrence",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "incomes" DROP COLUMN "dueDate",
ADD COLUMN     "paymentData" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "budgets";

-- DropTable
DROP TABLE "families";

-- DropTable
DROP TABLE "receivables";

-- DropTable
DROP TABLE "sessions";

-- DropTable
DROP TABLE "transaction_entries";

-- DropEnum
DROP TYPE "RecurrenceType";

-- DropEnum
DROP TYPE "TransactionType";
