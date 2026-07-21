-- Overrides explicites véhicule + snapshot voyage

ALTER TABLE "user_vehicles" ADD COLUMN IF NOT EXISTS "custom_consumption_l100" DECIMAL(5,2);
ALTER TABLE "user_vehicles" ADD COLUMN IF NOT EXISTS "manufacturer_fuel_type" VARCHAR(40);
ALTER TABLE "user_vehicles" ADD COLUMN IF NOT EXISTS "custom_fuel_type" VARCHAR(40);
ALTER TABLE "user_vehicles" ADD COLUMN IF NOT EXISTS "manufacturer_tank_capacity_l" DECIMAL(6,2);
ALTER TABLE "user_vehicles" ADD COLUMN IF NOT EXISTS "spec_overrides" JSONB;
ALTER TABLE "user_vehicles" ADD COLUMN IF NOT EXISTS "specs_updated_at" TIMESTAMPTZ(6);

ALTER TABLE "trip_routes" ADD COLUMN IF NOT EXISTS "vehicle_specs_snapshot" JSONB;
ALTER TABLE "trip_routes" ADD COLUMN IF NOT EXISTS "fuel_estimate_stale" BOOLEAN NOT NULL DEFAULT false;

-- Préserver le type carburant actuel comme valeur constructeur
UPDATE "user_vehicles"
SET "manufacturer_fuel_type" = "fuel_type"
WHERE "manufacturer_fuel_type" IS NULL
  AND "fuel_type" IS NOT NULL;

-- Capacité constructeur = override historique uniquement si source catalogue / legacy
UPDATE "user_vehicles"
SET "manufacturer_tank_capacity_l" = "tank_capacity_override"
WHERE "manufacturer_tank_capacity_l" IS NULL
  AND "tank_capacity_override" IS NOT NULL
  AND "tank_capacity_source" IN ('catalog', 'legacy_model');

-- Migrer conso « profil » (saisie manuelle sans assez de pleins) vers custom_consumption
UPDATE "user_vehicles" uv
SET "custom_consumption_l100" = uv."real_avg_consumption"
WHERE uv."custom_consumption_l100" IS NULL
  AND uv."real_avg_consumption" IS NOT NULL
  AND (
    SELECT COUNT(*)::int
    FROM "fuel_logs" fl
    WHERE fl."vehicle_id" = uv."id"
      AND fl."deleted_at" IS NULL
      AND fl."is_full" = true
  ) < 2;
