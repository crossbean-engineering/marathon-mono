-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "checkin_date" TIMESTAMP(3),
ADD COLUMN     "runner_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "participants_runner_number_key" ON "participants"("runner_number");

