-- AlterTable
ALTER TABLE "transaction_entries" ADD COLUMN     "createdById" TEXT NOT NULL DEFAULT 'cmjbnm3690001f0gj0efp248h';

-- AddForeignKey
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
