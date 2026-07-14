-- CreateTable
CREATE TABLE "fuel_stations" (
    "id" UUID NOT NULL,
    "external_key" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "banner" VARCHAR(120),
    "address" VARCHAR(300) NOT NULL,
    "region" VARCHAR(120),
    "postal_code" VARCHAR(20),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "country_code" CHAR(2) NOT NULL DEFAULT 'CA',
    "missing_streak" INTEGER NOT NULL DEFAULT 0,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "fuel_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_prices" (
    "id" UUID NOT NULL,
    "station_id" UUID NOT NULL,
    "fuel_type" VARCHAR(30) NOT NULL,
    "price" DECIMAL(8,3) NOT NULL,
    "captured_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_ingestions" (
    "id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "source_url" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6),
    "report" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_ingestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fuel_stations_external_key_key" ON "fuel_stations"("external_key");

-- CreateIndex
CREATE INDEX "fuel_stations_region_idx" ON "fuel_stations"("region");

-- CreateIndex
CREATE INDEX "fuel_stations_latitude_longitude_idx" ON "fuel_stations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "fuel_stations_deleted_at_idx" ON "fuel_stations"("deleted_at");

-- CreateIndex
CREATE INDEX "fuel_stations_last_seen_at_idx" ON "fuel_stations"("last_seen_at");

-- CreateIndex
CREATE INDEX "fuel_prices_station_id_fuel_type_captured_at_idx" ON "fuel_prices"("station_id", "fuel_type", "captured_at" DESC);

-- CreateIndex
CREATE INDEX "fuel_prices_fuel_type_captured_at_idx" ON "fuel_prices"("fuel_type", "captured_at");

-- CreateIndex
CREATE INDEX "fuel_prices_captured_at_idx" ON "fuel_prices"("captured_at");

-- CreateIndex
CREATE INDEX "fuel_ingestions_created_at_idx" ON "fuel_ingestions"("created_at");

-- CreateIndex
CREATE INDEX "fuel_ingestions_status_created_at_idx" ON "fuel_ingestions"("status", "created_at");

-- AddForeignKey
ALTER TABLE "fuel_prices" ADD CONSTRAINT "fuel_prices_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "fuel_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
