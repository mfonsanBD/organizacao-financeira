-- CreateTable
CREATE TABLE "income_entries" (
    "id" TEXT NOT NULL,
    "incomeId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "income_entries_familyId_date_idx" ON "income_entries"("familyId", "date");

-- CreateIndex
CREATE INDEX "income_entries_incomeId_date_idx" ON "income_entries"("incomeId", "date");

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES "incomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
