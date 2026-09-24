-- Enable uuid_generate_v1() used by model id defaults
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "PaymentNetwork" AS ENUM ('MTN', 'VODAFONE', 'AIRTELTIGO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'agent', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "WristbandStatus" AS ENUM ('available', 'redeemed', 'disabled');

-- CreateTable
CREATE TABLE "merchandise" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchandise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "benefits" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prizes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "name" TEXT NOT NULL,
    "amount" INTEGER,
    "position" INTEGER,
    "description" TEXT,
    "package_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "ic" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "shirt_size" TEXT,
    "gender" "Gender",
    "status" "ParticipantStatus" NOT NULL DEFAULT 'pending',
    "user_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "payment_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'mojopay',
    "gateway" TEXT NOT NULL DEFAULT 'MojoCollection',
    "order_id" TEXT NOT NULL,
    "provider_transaction_id" TEXT NOT NULL,
    "momo_number" TEXT NOT NULL,
    "network" "PaymentNetwork" NOT NULL,
    "email" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "invoice_payload" JSONB,
    "reason" TEXT,
    "requires_attention" BOOLEAN NOT NULL DEFAULT false,
    "performed_by" UUID NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "id_number" TEXT,
    "location" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wristbands" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "code" TEXT NOT NULL,
    "status" "WristbandStatus" NOT NULL DEFAULT 'available',
    "is_printed" BOOLEAN NOT NULL DEFAULT false,
    "participant_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wristbands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MerchandiseToPackage" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_MerchandiseToPackage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "packages_name_key" ON "packages"("name");

-- CreateIndex
CREATE INDEX "prizes_package_id_idx" ON "prizes"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "participants_name_key" ON "participants"("name");

-- CreateIndex
CREATE UNIQUE INDEX "participants_code_key" ON "participants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "participants_payment_id_key" ON "participants"("payment_id");

-- CreateIndex
CREATE INDEX "participants_user_id_idx" ON "participants"("user_id");

-- CreateIndex
CREATE INDEX "participants_package_id_idx" ON "participants"("package_id");

-- CreateIndex
CREATE INDEX "participants_code_idx" ON "participants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_transaction_id_key" ON "payments"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_requires_attention_idx" ON "payments"("requires_attention");

-- CreateIndex
CREATE INDEX "payments_performed_by_idx" ON "payments"("performed_by");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "wristbands_code_key" ON "wristbands"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wristbands_participant_id_key" ON "wristbands"("participant_id");

-- CreateIndex
CREATE INDEX "wristbands_code_idx" ON "wristbands"("code");

-- CreateIndex
CREATE INDEX "wristbands_status_idx" ON "wristbands"("status");

-- CreateIndex
CREATE INDEX "_MerchandiseToPackage_B_index" ON "_MerchandiseToPackage"("B");

-- AddForeignKey
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wristbands" ADD CONSTRAINT "wristbands_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MerchandiseToPackage" ADD CONSTRAINT "_MerchandiseToPackage_A_fkey" FOREIGN KEY ("A") REFERENCES "merchandise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MerchandiseToPackage" ADD CONSTRAINT "_MerchandiseToPackage_B_fkey" FOREIGN KEY ("B") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
