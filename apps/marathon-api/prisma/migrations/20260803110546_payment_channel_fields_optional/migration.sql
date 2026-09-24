-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'waived';

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "momo_number" DROP NOT NULL,
ALTER COLUMN "network" DROP NOT NULL;
