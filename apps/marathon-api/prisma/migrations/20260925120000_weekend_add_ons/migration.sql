-- CreateEnum
CREATE TYPE "AddOnType" AS ENUM ('accommodation', 'transport');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "add_on_amount" INTEGER;

-- CreateTable
CREATE TABLE "add_ons" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "type" "AddOnType" NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "description" TEXT,
    "occupancy" INTEGER,
    "price" INTEGER NOT NULL,
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_add_ons" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "participant_id" UUID NOT NULL,
    "add_on_id" UUID NOT NULL,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "add_ons_type_idx" ON "add_ons"("type");

-- CreateIndex
CREATE INDEX "participant_add_ons_participant_id_idx" ON "participant_add_ons"("participant_id");

-- CreateIndex
CREATE INDEX "participant_add_ons_add_on_id_idx" ON "participant_add_ons"("add_on_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_add_ons_participant_id_add_on_id_key" ON "participant_add_ons"("participant_id", "add_on_id");

-- AddForeignKey
ALTER TABLE "participant_add_ons" ADD CONSTRAINT "participant_add_ons_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_add_ons" ADD CONSTRAINT "participant_add_ons_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "add_ons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

