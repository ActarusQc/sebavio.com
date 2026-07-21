/**
 * Nettoyage de sécurité des positions GPS orphelines (voyage non in_progress).
 * Invocable via cron : npx tsx scripts/cleanup-trip-locations.ts
 */
import { cleanupStaleTripLocations } from "@/features/trips/services/trip-locations";

async function main() {
  const result = await cleanupStaleTripLocations();
  // Pas de coordonnées dans les logs.
  console.info(
    `[cleanup-trip-locations] trips=${result.tripsProcessed} points=${result.pointsDeleted}`,
  );
}

main().catch((error) => {
  console.error(
    "[cleanup-trip-locations] failed",
    error instanceof Error ? error.message : "unknown",
  );
  process.exit(1);
});
