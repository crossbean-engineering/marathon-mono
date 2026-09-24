-- CreateTable
CREATE TABLE "participant_merchandise" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v1(),
    "participant_id" UUID NOT NULL,
    "merchandise_id" UUID NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_merchandise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participant_merchandise_participant_id_idx" ON "participant_merchandise"("participant_id");

-- CreateIndex
CREATE INDEX "participant_merchandise_merchandise_id_idx" ON "participant_merchandise"("merchandise_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_merchandise_participant_id_merchandise_id_key" ON "participant_merchandise"("participant_id", "merchandise_id");

-- AddForeignKey
ALTER TABLE "participant_merchandise" ADD CONSTRAINT "participant_merchandise_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_merchandise" ADD CONSTRAINT "participant_merchandise_merchandise_id_fkey" FOREIGN KEY ("merchandise_id") REFERENCES "merchandise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

