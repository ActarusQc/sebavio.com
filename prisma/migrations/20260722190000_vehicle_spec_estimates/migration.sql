-- Cache partagé estimations conso / réservoir (NRCan + IA)

CREATE TABLE IF NOT EXISTS "vehicle_spec_estimates" (
    "id" UUID NOT NULL,
    "cache_key" VARCHAR(400) NOT NULL,
    "catalog_entry_id" UUID,
    "make" VARCHAR(150),
    "model" VARCHAR(200),
    "year" INTEGER,
    "configuration" VARCHAR(300),
    "consumption_l100" DECIMAL(6,2),
    "tank_capacity_l" DECIMAL(6,2),
    "consumption_source" VARCHAR(40),
    "tank_capacity_source" VARCHAR(40),
    "confidence" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vehicle_spec_estimates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_spec_estimates_cache_key_key"
  ON "vehicle_spec_estimates"("cache_key");

CREATE INDEX IF NOT EXISTS "vehicle_spec_estimates_catalog_entry_id_idx"
  ON "vehicle_spec_estimates"("catalog_entry_id");

CREATE INDEX IF NOT EXISTS "vehicle_spec_estimates_deleted_at_idx"
  ON "vehicle_spec_estimates"("deleted_at");
