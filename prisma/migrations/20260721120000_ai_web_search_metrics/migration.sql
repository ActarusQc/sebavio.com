-- AlterTable
ALTER TABLE "ai_usages" ADD COLUMN "knowledge_mode" VARCHAR(40);
ALTER TABLE "ai_usages" ADD COLUMN "intent" VARCHAR(60);
ALTER TABLE "ai_usages" ADD COLUMN "web_search_used" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_usages" ADD COLUMN "web_search_call_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ai_usages" ADD COLUMN "source_count" INTEGER;

-- CreateIndex
CREATE INDEX "ai_usages_web_search_used_created_at_idx" ON "ai_usages"("web_search_used", "created_at");
CREATE INDEX "ai_usages_intent_created_at_idx" ON "ai_usages"("intent", "created_at");
