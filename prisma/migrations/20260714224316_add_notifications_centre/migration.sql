-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "channel" VARCHAR(20) NOT NULL DEFAULT 'in_app',
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "dedupe_key" VARCHAR(255) NOT NULL,
    "source_entity" VARCHAR(100),
    "source_id" UUID,
    "href" VARCHAR(500),
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "user_id" UUID NOT NULL,
    "in_app_maintenance" BOOLEAN NOT NULL DEFAULT true,
    "in_app_trip" BOOLEAN NOT NULL DEFAULT true,
    "in_app_budget" BOOLEAN NOT NULL DEFAULT true,
    "in_app_weather" BOOLEAN NOT NULL DEFAULT true,
    "in_app_fuel" BOOLEAN NOT NULL DEFAULT true,
    "email_maintenance" BOOLEAN NOT NULL DEFAULT false,
    "email_trip" BOOLEAN NOT NULL DEFAULT false,
    "email_budget" BOOLEAN NOT NULL DEFAULT false,
    "email_weather" BOOLEAN NOT NULL DEFAULT false,
    "email_fuel" BOOLEAN NOT NULL DEFAULT false,
    "push_maintenance" BOOLEAN NOT NULL DEFAULT false,
    "push_trip" BOOLEAN NOT NULL DEFAULT false,
    "push_budget" BOOLEAN NOT NULL DEFAULT false,
    "push_weather" BOOLEAN NOT NULL DEFAULT false,
    "push_fuel" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Unique partielle : anti-doublon tout en permettant un nouveau cycle après soft-delete
-- (ex. budget_exceeded qui disparaît puis réapparaît).
CREATE UNIQUE INDEX "notifications_user_channel_dedupe_active_key"
ON "notifications" ("user_id", "channel", "dedupe_key")
WHERE "deleted_at" IS NULL;
