-- AlterTable
ALTER TABLE "ai_usages" ADD COLUMN "provider" VARCHAR(40);

-- CreateIndex
CREATE INDEX "ai_usages_provider_created_at_idx" ON "ai_usages"("provider", "created_at");
