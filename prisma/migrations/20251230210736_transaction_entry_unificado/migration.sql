/*
  Warnings:

  - You are about to drop the `income_entries` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "income_entries" DROP CONSTRAINT "income_entries_familyId_fkey";

-- DropForeignKey
ALTER TABLE "income_entries" DROP CONSTRAINT "income_entries_incomeId_fkey";

-- DropTable
DROP TABLE "income_entries";

-- CreateTable
CREATE TABLE "transaction_entries" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "incomeId" TEXT,
    "expenseId" TEXT,
    "categoryId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_entries_familyId_date_idx" ON "transaction_entries"("familyId", "date");

-- CreateIndex
CREATE INDEX "transaction_entries_incomeId_date_idx" ON "transaction_entries"("incomeId", "date");

-- CreateIndex
CREATE INDEX "transaction_entries_expenseId_date_idx" ON "transaction_entries"("expenseId", "date");

-- CreateIndex
CREATE INDEX "transaction_entries_categoryId_idx" ON "transaction_entries"("categoryId");

-- AddForeignKey
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES "incomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
