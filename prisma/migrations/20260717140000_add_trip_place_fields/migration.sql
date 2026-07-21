-- Place metadata for trip origin / destination (Google Places Autocomplete).
-- Reuses trips.origin / trips.destination as display addresses.

ALTER TABLE "trips"
  ADD COLUMN "origin_place_id" VARCHAR(255),
  ADD COLUMN "origin_latitude" DECIMAL(10, 7),
  ADD COLUMN "origin_longitude" DECIMAL(10, 7),
  ADD COLUMN "origin_city" VARCHAR(120),
  ADD COLUMN "origin_province" VARCHAR(120),
  ADD COLUMN "origin_postal_code" VARCHAR(20),
  ADD COLUMN "origin_country" VARCHAR(2),
  ADD COLUMN "destination_place_id" VARCHAR(255),
  ADD COLUMN "destination_latitude" DECIMAL(10, 7),
  ADD COLUMN "destination_longitude" DECIMAL(10, 7),
  ADD COLUMN "destination_city" VARCHAR(120),
  ADD COLUMN "destination_province" VARCHAR(120),
  ADD COLUMN "destination_postal_code" VARCHAR(20),
  ADD COLUMN "destination_country" VARCHAR(2);
