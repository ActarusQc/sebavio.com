-- AlterTable
ALTER TABLE "maintenance_history" ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "invoice_number" VARCHAR(100),
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
ADD COLUMN     "task_definition_id" UUID;

-- AlterTable
ALTER TABLE "notification_preferences" ADD COLUMN     "maintenance_lead_days" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "maintenance_lead_km" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "maintenance_reminder_frequency_days" INTEGER NOT NULL DEFAULT 7;

-- AlterTable
ALTER TABLE "user_vehicles" ADD COLUMN     "annual_estimated_km" INTEGER,
ADD COLUMN     "body_class" VARCHAR(80),
ADD COLUMN     "cylinders" INTEGER,
ADD COLUMN     "displacement_l" DECIMAL(4,1),
ADD COLUMN     "drivetrain" VARCHAR(80),
ADD COLUMN     "engine" VARCHAR(150),
ADD COLUMN     "identification_confidence" VARCHAR(20),
ADD COLUMN     "identification_source" VARCHAR(30),
ADD COLUMN     "in_service_date" DATE,
ADD COLUMN     "manufacturer_name" VARCHAR(150),
ADD COLUMN     "plant_country" VARCHAR(80),
ADD COLUMN     "transmission" VARCHAR(80),
ADD COLUMN     "usage_factors" JSONB,
ADD COLUMN     "usage_profile" VARCHAR(20) NOT NULL DEFAULT 'automatic',
ADD COLUMN     "vehicle_type" VARCHAR(80);

-- CreateTable
CREATE TABLE "provider_maintenance_schedules" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_vehicle_id" VARCHAR(120),
    "source_type" VARCHAR(30) NOT NULL,
    "source_reference" VARCHAR(255),
    "source_retrieved_at" TIMESTAMPTZ(6) NOT NULL,
    "source_version" VARCHAR(80),
    "normal_conditions" BOOLEAN NOT NULL DEFAULT true,
    "severe_conditions" BOOLEAN NOT NULL DEFAULT false,
    "raw_data_hash" VARCHAR(64),
    "is_stale" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_error" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "provider_maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_task_definitions" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "external_id" VARCHAR(120),
    "category" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "action_type" VARCHAR(30) NOT NULL,
    "interval_km" INTEGER,
    "interval_months" INTEGER,
    "first_due_km" INTEGER,
    "first_due_months" INTEGER,
    "condition_type" VARCHAR(20) NOT NULL DEFAULT 'both',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "official_manufacturer_recommendation" BOOLEAN NOT NULL DEFAULT false,
    "inspection_only" BOOLEAN NOT NULL DEFAULT false,
    "estimated_duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "maintenance_task_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_maintenance_reminders" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "task_definition_id" UUID NOT NULL,
    "due_date" DATE,
    "due_odometer_km" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "calculation_source" VARCHAR(30) NOT NULL DEFAULT 'calculated',
    "dismissed_until" TIMESTAMPTZ(6),
    "completed_event_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicle_maintenance_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_safety_recalls" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "external_recall_id" VARCHAR(120) NOT NULL,
    "source" VARCHAR(40) NOT NULL,
    "manufacturer" VARCHAR(150),
    "model" VARCHAR(150),
    "year" INTEGER,
    "title" VARCHAR(300) NOT NULL,
    "summary" TEXT,
    "risk_description" TEXT,
    "corrective_action" TEXT,
    "recall_date" DATE,
    "official_url" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'possibly_applicable',
    "vin_match_uncertain" BOOLEAN NOT NULL DEFAULT true,
    "last_checked_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicle_safety_recalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_provider_cache" (
    "id" UUID NOT NULL,
    "cache_key" VARCHAR(128) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "vin_normalized" VARCHAR(17),
    "year" INTEGER,
    "make" VARCHAR(150),
    "model" VARCHAR(150),
    "trim" VARCHAR(150),
    "engine" VARCHAR(150),
    "payload" JSONB NOT NULL,
    "source_version" VARCHAR(80),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "maintenance_provider_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_maintenance_schedules_vehicle_id_idx" ON "provider_maintenance_schedules"("vehicle_id");

-- CreateIndex
CREATE INDEX "provider_maintenance_schedules_provider_idx" ON "provider_maintenance_schedules"("provider");

-- CreateIndex
CREATE INDEX "provider_maintenance_schedules_source_retrieved_at_idx" ON "provider_maintenance_schedules"("source_retrieved_at");

-- CreateIndex
CREATE UNIQUE INDEX "provider_maintenance_schedules_vehicle_id_provider_key" ON "provider_maintenance_schedules"("vehicle_id", "provider");

-- CreateIndex
CREATE INDEX "maintenance_task_definitions_schedule_id_idx" ON "maintenance_task_definitions"("schedule_id");

-- CreateIndex
CREATE INDEX "maintenance_task_definitions_category_idx" ON "maintenance_task_definitions"("category");

-- CreateIndex
CREATE INDEX "maintenance_task_definitions_priority_idx" ON "maintenance_task_definitions"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_task_definitions_schedule_id_external_id_key" ON "maintenance_task_definitions"("schedule_id", "external_id");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_reminders_vehicle_id_status_idx" ON "vehicle_maintenance_reminders"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_reminders_due_date_idx" ON "vehicle_maintenance_reminders"("due_date");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_reminders_due_odometer_km_idx" ON "vehicle_maintenance_reminders"("due_odometer_km");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_reminders_dismissed_until_idx" ON "vehicle_maintenance_reminders"("dismissed_until");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_maintenance_reminders_vehicle_id_task_definition_id_key" ON "vehicle_maintenance_reminders"("vehicle_id", "task_definition_id");

-- CreateIndex
CREATE INDEX "vehicle_safety_recalls_vehicle_id_status_idx" ON "vehicle_safety_recalls"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "vehicle_safety_recalls_last_checked_at_idx" ON "vehicle_safety_recalls"("last_checked_at");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_safety_recalls_vehicle_id_source_external_recall_id_key" ON "vehicle_safety_recalls"("vehicle_id", "source", "external_recall_id");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_provider_cache_cache_key_key" ON "maintenance_provider_cache"("cache_key");

-- CreateIndex
CREATE INDEX "maintenance_provider_cache_provider_idx" ON "maintenance_provider_cache"("provider");

-- CreateIndex
CREATE INDEX "maintenance_provider_cache_expires_at_idx" ON "maintenance_provider_cache"("expires_at");

-- CreateIndex
CREATE INDEX "maintenance_provider_cache_vin_normalized_idx" ON "maintenance_provider_cache"("vin_normalized");

-- CreateIndex
CREATE INDEX "maintenance_history_task_definition_id_idx" ON "maintenance_history"("task_definition_id");

-- AddForeignKey
ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_task_definition_id_fkey" FOREIGN KEY ("task_definition_id") REFERENCES "maintenance_task_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_maintenance_schedules" ADD CONSTRAINT "provider_maintenance_schedules_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_task_definitions" ADD CONSTRAINT "maintenance_task_definitions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "provider_maintenance_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenance_reminders" ADD CONSTRAINT "vehicle_maintenance_reminders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenance_reminders" ADD CONSTRAINT "vehicle_maintenance_reminders_task_definition_id_fkey" FOREIGN KEY ("task_definition_id") REFERENCES "maintenance_task_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenance_reminders" ADD CONSTRAINT "vehicle_maintenance_reminders_completed_event_id_fkey" FOREIGN KEY ("completed_event_id") REFERENCES "maintenance_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_safety_recalls" ADD CONSTRAINT "vehicle_safety_recalls_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
