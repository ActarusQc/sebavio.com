-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "filled_at" DATE NOT NULL,
    "odometer_km" INTEGER NOT NULL,
    "liters" DECIMAL(8,3) NOT NULL,
    "price_per_liter" DECIMAL(8,3) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "is_full" BOOLEAN NOT NULL DEFAULT true,
    "fuel_type" VARCHAR(30),
    "station_name" VARCHAR(200),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_logs_vehicle_id_idx" ON "fuel_logs"("vehicle_id");

-- CreateIndex
CREATE INDEX "fuel_logs_vehicle_id_filled_at_idx" ON "fuel_logs"("vehicle_id", "filled_at");

-- CreateIndex
CREATE INDEX "fuel_logs_vehicle_id_odometer_km_idx" ON "fuel_logs"("vehicle_id", "odometer_km");

-- CreateIndex
CREATE INDEX "fuel_logs_deleted_at_idx" ON "fuel_logs"("deleted_at");

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
