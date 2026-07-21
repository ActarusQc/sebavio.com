-- Séquences indépendantes par direction (aller / retour)
ALTER TABLE "trip_stops" DROP CONSTRAINT IF EXISTS "trip_stops_trip_id_sequence_key";
DROP INDEX IF EXISTS "trip_stops_trip_id_sequence_key";

CREATE UNIQUE INDEX IF NOT EXISTS "trip_stops_trip_id_direction_sequence_key"
  ON "trip_stops"("trip_id", "direction", "sequence");
