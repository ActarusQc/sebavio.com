-- Sessions de planification de voyage guidée par l’IA

CREATE TABLE "ai_trip_planning_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" VARCHAR(40) NOT NULL DEFAULT 'collecting',
    "messages" JSONB NOT NULL,
    "structured_draft" JSONB NOT NULL,
    "created_trip_id" UUID,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_trip_planning_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_trip_planning_sessions_user_id_status_idx" ON "ai_trip_planning_sessions"("user_id", "status");
CREATE INDEX "ai_trip_planning_sessions_user_id_updated_at_idx" ON "ai_trip_planning_sessions"("user_id", "updated_at");
CREATE INDEX "ai_trip_planning_sessions_created_trip_id_idx" ON "ai_trip_planning_sessions"("created_trip_id");

ALTER TABLE "ai_trip_planning_sessions" ADD CONSTRAINT "ai_trip_planning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_trip_planning_sessions" ADD CONSTRAINT "ai_trip_planning_sessions_created_trip_id_fkey" FOREIGN KEY ("created_trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
