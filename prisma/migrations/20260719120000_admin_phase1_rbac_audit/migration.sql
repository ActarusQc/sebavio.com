-- Phase 1 admin foundation: RBAC roles width + audit enrichment (non-destructive)

ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR(32);

ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_role" VARCHAR(32);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "user_agent" VARCHAR(512);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "request_id" VARCHAR(64);

ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE VARCHAR(80);

CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_actor_role_idx" ON "audit_logs"("actor_role");
