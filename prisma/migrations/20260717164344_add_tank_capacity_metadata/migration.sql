-- AlterTable
ALTER TABLE "user_vehicles" ADD COLUMN     "tank_capacity_source" VARCHAR(40),
ADD COLUMN     "tank_capacity_updated_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "vehicle_catalog_entries" ADD COLUMN     "fuel_tank_capacity_l" DECIMAL(6,2);

-- RenameIndex
ALTER INDEX "vehicle_catalog_entries_model_year_make_normalized_model_normal" RENAME TO "vehicle_catalog_entries_model_year_make_normalized_model_no_idx";
