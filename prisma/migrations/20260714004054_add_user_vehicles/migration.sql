-- CreateTable
CREATE TABLE "user_vehicles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "model_id" UUID,
    "is_manual_entry" BOOLEAN NOT NULL DEFAULT false,
    "manual_manufacturer_name" VARCHAR(150),
    "manual_model_name" VARCHAR(150),
    "manual_year" INTEGER,
    "manual_category" VARCHAR(30),
    "manual_trim" VARCHAR(150),
    "nickname" VARCHAR(100),
    "vin" VARCHAR(17),
    "license_plate" VARCHAR(20),
    "purchase_date" DATE,
    "purchase_price" DECIMAL(12,2),
    "current_odometer" INTEGER NOT NULL,
    "real_avg_consumption" DECIMAL(5,2),
    "tank_capacity_override" DECIMAL(6,2),
    "primary_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vehicle_documents" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "file_url" TEXT NOT NULL,
    "expiry_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_photos" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" VARCHAR(200),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicle_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_settings" (
    "vehicle_id" UUID NOT NULL,
    "preferred_fuel_type" VARCHAR(30),
    "winter_mode" BOOLEAN NOT NULL DEFAULT false,
    "avoid_unpaved_roads" BOOLEAN NOT NULL DEFAULT false,
    "toll_preference" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicle_settings_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateIndex
CREATE INDEX "user_vehicles_user_id_idx" ON "user_vehicles"("user_id");

-- CreateIndex
CREATE INDEX "user_vehicles_model_id_idx" ON "user_vehicles"("model_id");

-- CreateIndex
CREATE INDEX "user_vehicles_vin_idx" ON "user_vehicles"("vin");

-- CreateIndex
CREATE INDEX "user_vehicles_user_id_primary_vehicle_idx" ON "user_vehicles"("user_id", "primary_vehicle");

-- CreateIndex
CREATE INDEX "user_vehicles_deleted_at_idx" ON "user_vehicles"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_vehicles_user_id_vin_key" ON "user_vehicles"("user_id", "vin");

-- CreateIndex
CREATE INDEX "user_vehicle_documents_vehicle_id_idx" ON "user_vehicle_documents"("vehicle_id");

-- CreateIndex
CREATE INDEX "user_vehicle_documents_expiry_date_idx" ON "user_vehicle_documents"("expiry_date");

-- CreateIndex
CREATE INDEX "vehicle_photos_vehicle_id_idx" ON "vehicle_photos"("vehicle_id");

-- AddForeignKey
ALTER TABLE "user_vehicles" ADD CONSTRAINT "user_vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vehicles" ADD CONSTRAINT "user_vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vehicle_documents" ADD CONSTRAINT "user_vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_settings" ADD CONSTRAINT "vehicle_settings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
