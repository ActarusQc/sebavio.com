-- CreateTable
CREATE TABLE "trip_locations" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "client_point_id" UUID NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracy_m" DECIMAL(10,2),
    "heading" DECIMAL(6,2),
    "speed_mps" DECIMAL(8,3),
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_locations_trip_id_recorded_at_idx" ON "trip_locations"("trip_id", "recorded_at");

-- CreateIndex
CREATE INDEX "trip_locations_user_id_recorded_at_idx" ON "trip_locations"("user_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "trip_locations_trip_id_client_point_id_key" ON "trip_locations"("trip_id", "client_point_id");

-- AddForeignKey
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
