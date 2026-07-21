-- Catalogue NRCan (cotes de consommation) + lien véhicules utilisateurs

CREATE TABLE "vehicle_catalog_entries" (
    "id" UUID NOT NULL,
    "source_key" VARCHAR(64) NOT NULL,
    "model_year" INTEGER NOT NULL,
    "make" VARCHAR(150) NOT NULL,
    "make_normalized" VARCHAR(150) NOT NULL,
    "model" VARCHAR(200) NOT NULL,
    "model_normalized" VARCHAR(200) NOT NULL,
    "configuration" VARCHAR(300),
    "vehicle_class" VARCHAR(120),
    "engine_size_litres" DECIMAL(4,1),
    "cylinders" INTEGER,
    "transmission" VARCHAR(40),
    "transmission_code" VARCHAR(40),
    "fuel_type" VARCHAR(80),
    "normalized_fuel_type" VARCHAR(40),
    "city_consumption_l100_km" DECIMAL(6,2),
    "highway_consumption_l100_km" DECIMAL(6,2),
    "combined_consumption_l100_km" DECIMAL(6,2),
    "combined_mpg" DECIMAL(6,1),
    "co2_emissions_g_km" INTEGER,
    "co2_rating" INTEGER,
    "smog_rating" INTEGER,
    "electric_consumption_kwh_100_km" DECIMAL(6,2),
    "electric_range_km" INTEGER,
    "source_name" VARCHAR(120) NOT NULL,
    "source_dataset" VARCHAR(200),
    "source_resource_url" TEXT,
    "source_year" INTEGER,
    "imported_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "raw_data" JSONB,

    CONSTRAINT "vehicle_catalog_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vehicle_catalog_entries_source_key_key" ON "vehicle_catalog_entries"("source_key");
CREATE INDEX "vehicle_catalog_entries_model_year_idx" ON "vehicle_catalog_entries"("model_year");
CREATE INDEX "vehicle_catalog_entries_model_year_make_normalized_idx" ON "vehicle_catalog_entries"("model_year", "make_normalized");
CREATE INDEX "vehicle_catalog_entries_model_year_make_normalized_model_normalized_idx" ON "vehicle_catalog_entries"("model_year", "make_normalized", "model_normalized");
CREATE INDEX "vehicle_catalog_entries_normalized_fuel_type_idx" ON "vehicle_catalog_entries"("normalized_fuel_type");
CREATE INDEX "vehicle_catalog_entries_is_active_idx" ON "vehicle_catalog_entries"("is_active");

CREATE TABLE "vehicle_catalog_syncs" (
    "id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "source_dataset" VARCHAR(200),
    "source_resource_url" TEXT,
    "source_checksum" VARCHAR(128),
    "source_modified_at" TIMESTAMPTZ(6),
    "records_read" INTEGER NOT NULL DEFAULT 0,
    "records_created" INTEGER NOT NULL DEFAULT 0,
    "records_updated" INTEGER NOT NULL DEFAULT 0,
    "records_unchanged" INTEGER NOT NULL DEFAULT 0,
    "records_rejected" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_catalog_syncs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vehicle_catalog_syncs_started_at_idx" ON "vehicle_catalog_syncs"("started_at");
CREATE INDEX "vehicle_catalog_syncs_status_started_at_idx" ON "vehicle_catalog_syncs"("status", "started_at");

ALTER TABLE "user_vehicles" ADD COLUMN "catalog_entry_id" UUID;
ALTER TABLE "user_vehicles" ADD COLUMN "fuel_type" VARCHAR(40);
ALTER TABLE "user_vehicles" ADD COLUMN "official_city_consumption_l100" DECIMAL(6,2);
ALTER TABLE "user_vehicles" ADD COLUMN "official_highway_consumption_l100" DECIMAL(6,2);
ALTER TABLE "user_vehicles" ADD COLUMN "official_combined_consumption_l100" DECIMAL(6,2);
ALTER TABLE "user_vehicles" ADD COLUMN "consumption_data_source" VARCHAR(40);

CREATE INDEX "user_vehicles_catalog_entry_id_idx" ON "user_vehicles"("catalog_entry_id");

ALTER TABLE "user_vehicles" ADD CONSTRAINT "user_vehicles_catalog_entry_id_fkey" FOREIGN KEY ("catalog_entry_id") REFERENCES "vehicle_catalog_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
