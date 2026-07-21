-- Agent vocal Sebavio — sessions + metering + entitlement

CREATE TABLE "ai_voice_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "conversation_id" UUID,
    "usage_mode" VARCHAR(20) NOT NULL DEFAULT 'conversation',
    "client_platform" VARCHAR(40) NOT NULL DEFAULT 'web',
    "provider" VARCHAR(40) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "pseudonym_id" VARCHAR(64) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "user_audio_seconds" INTEGER NOT NULL DEFAULT 0,
    "assistant_audio_seconds" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "interruption_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "end_reason" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_voice_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_voice_usages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID,
    "trip_id" UUID,
    "event_type" VARCHAR(40) NOT NULL,
    "seconds_delta" INTEGER NOT NULL DEFAULT 0,
    "plan_slug" VARCHAR(100),
    "provider" VARCHAR(40),
    "client_platform" VARCHAR(40),
    "usage_mode" VARCHAR(20),
    "error_code" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_voice_usages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_voice_sessions_user_id_started_at_idx" ON "ai_voice_sessions"("user_id", "started_at");
CREATE INDEX "ai_voice_sessions_user_id_status_idx" ON "ai_voice_sessions"("user_id", "status");
CREATE INDEX "ai_voice_sessions_trip_id_started_at_idx" ON "ai_voice_sessions"("trip_id", "started_at");
CREATE INDEX "ai_voice_sessions_expires_at_idx" ON "ai_voice_sessions"("expires_at");

CREATE INDEX "ai_voice_usages_user_id_created_at_idx" ON "ai_voice_usages"("user_id", "created_at");
CREATE INDEX "ai_voice_usages_session_id_idx" ON "ai_voice_usages"("session_id");
CREATE INDEX "ai_voice_usages_created_at_idx" ON "ai_voice_usages"("created_at");

ALTER TABLE "ai_voice_sessions" ADD CONSTRAINT "ai_voice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_voice_sessions" ADD CONSTRAINT "ai_voice_sessions_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_voice_usages" ADD CONSTRAINT "ai_voice_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Entitlement ai.voice.enabled pour les forfaits qui ont déjà ai.planning.enabled=true
INSERT INTO "plan_entitlements" ("id", "plan_id", "key", "enabled", "limit", "value", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  pe."plan_id",
  'ai.voice.enabled',
  true,
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "plan_entitlements" pe
WHERE pe."key" = 'ai.planning.enabled'
  AND pe."enabled" = true
  AND NOT EXISTS (
    SELECT 1
    FROM "plan_entitlements" existing
    WHERE existing."plan_id" = pe."plan_id"
      AND existing."key" = 'ai.voice.enabled'
  );
