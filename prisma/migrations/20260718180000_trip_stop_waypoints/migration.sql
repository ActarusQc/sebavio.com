-- Waypoints manuels : direction aller/retour, durée sur place, placeId, notes
-- + polyline / métriques du trajet retour sur trip_routes

ALTER TABLE "trip_stops"
  ADD COLUMN IF NOT EXISTS "direction" VARCHAR(20) NOT NULL DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS "place_id" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "duration_minutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE INDEX IF NOT EXISTS "trip_stops_trip_id_direction_sequence_idx"
  ON "trip_stops"("trip_id", "direction", "sequence");

ALTER TABLE "trip_routes"
  ADD COLUMN IF NOT EXISTS "return_distance_km" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "return_estimated_duration_min" INTEGER,
  ADD COLUMN IF NOT EXISTS "return_polyline" TEXT;
