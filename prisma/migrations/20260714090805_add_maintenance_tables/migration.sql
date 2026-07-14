-- AlterTable
ALTER TABLE "user_vehicles" ADD COLUMN     "odometer_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "maintenance_templates" (
    "id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "interval_km" INTEGER,
    "interval_months" INTEGER,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "description" TEXT,
    "manufacturer_source" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "maintenance_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedule" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "template_id" UUID,
    "next_due_date" DATE,
    "next_due_odometer" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    "last_calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "maintenance_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_history" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "template_id" UUID,
    "performed_date" DATE NOT NULL,
    "performed_odometer" INTEGER NOT NULL,
    "provider" VARCHAR(200),
    "cost" DECIMAL(10,2),
    "currency" CHAR(3),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "maintenance_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_documents" (
    "id" UUID NOT NULL,
    "history_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "maintenance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_notifications" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "notification_date" TIMESTAMPTZ(6) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "maintenance_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_templates_model_id_idx" ON "maintenance_templates"("model_id");

-- CreateIndex
CREATE INDEX "maintenance_templates_category_idx" ON "maintenance_templates"("category");

-- CreateIndex
CREATE INDEX "maintenance_templates_priority_idx" ON "maintenance_templates"("priority");

-- CreateIndex
CREATE INDEX "maintenance_schedule_vehicle_id_idx" ON "maintenance_schedule"("vehicle_id");

-- CreateIndex
CREATE INDEX "maintenance_schedule_template_id_idx" ON "maintenance_schedule"("template_id");

-- CreateIndex
CREATE INDEX "maintenance_schedule_status_idx" ON "maintenance_schedule"("status");

-- CreateIndex
CREATE INDEX "maintenance_schedule_vehicle_id_status_idx" ON "maintenance_schedule"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_history_vehicle_id_idx" ON "maintenance_history"("vehicle_id");

-- CreateIndex
CREATE INDEX "maintenance_history_template_id_idx" ON "maintenance_history"("template_id");

-- CreateIndex
CREATE INDEX "maintenance_history_vehicle_id_performed_date_idx" ON "maintenance_history"("vehicle_id", "performed_date");

-- CreateIndex
CREATE INDEX "maintenance_history_vehicle_id_performed_odometer_idx" ON "maintenance_history"("vehicle_id", "performed_odometer");

-- CreateIndex
CREATE INDEX "maintenance_history_deleted_at_idx" ON "maintenance_history"("deleted_at");

-- CreateIndex
CREATE INDEX "maintenance_documents_history_id_idx" ON "maintenance_documents"("history_id");

-- CreateIndex
CREATE INDEX "maintenance_notifications_vehicle_id_idx" ON "maintenance_notifications"("vehicle_id");

-- CreateIndex
CREATE INDEX "maintenance_notifications_schedule_id_idx" ON "maintenance_notifications"("schedule_id");

-- CreateIndex
CREATE INDEX "maintenance_notifications_sent_notification_date_idx" ON "maintenance_notifications"("sent", "notification_date");

-- CreateIndex
CREATE INDEX "user_vehicles_odometer_updated_at_idx" ON "user_vehicles"("odometer_updated_at");

-- AddForeignKey
ALTER TABLE "maintenance_templates" ADD CONSTRAINT "maintenance_templates_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedule" ADD CONSTRAINT "maintenance_schedule_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedule" ADD CONSTRAINT "maintenance_schedule_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "maintenance_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_history" ADD CONSTRAINT "maintenance_history_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "maintenance_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_documents" ADD CONSTRAINT "maintenance_documents_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "maintenance_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_notifications" ADD CONSTRAINT "maintenance_notifications_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_notifications" ADD CONSTRAINT "maintenance_notifications_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "maintenance_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
