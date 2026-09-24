-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'momo', 'cash');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'momo';

-- CreateIndex
CREATE INDEX "payments_payment_method_idx" ON "payments"("payment_method");
