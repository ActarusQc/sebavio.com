/**
 * Smoke test manuel des APIs externes (NHTSA / fournisseur entretien).
 * Désactivé en CI — lancer explicitement :
 *
 *   npm run test:live:maintenance
 *
 * Ne journalise jamais de clé API.
 */
import "dotenv/config";
import { decodeVinWithNhtsa } from "@/services/vin-decode";
import { createMaintenanceProviderFromEnv } from "@/services/maintenance-schedule";

async function main() {
  const vin = process.env.SMOKE_VIN?.trim() || "2T3P1RFV5MC123456";
  console.info("[smoke] NHTSA decode", { vin });
  try {
    const decoded = await decodeVinWithNhtsa(vin);
    console.info("[smoke] decoded", {
      make: decoded.make,
      model: decoded.model,
      year: decoded.year,
      confidence: decoded.confidence,
      isCertain: decoded.isCertain,
    });
  } catch (error) {
    console.error("[smoke] NHTSA failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    const provider = createMaintenanceProviderFromEnv();
    console.info("[smoke] provider", { name: provider.providerName });
    const schedule = await provider.getSchedule({
      year: 2021,
      make: "Toyota",
      model: "RAV4",
    });
    console.info("[smoke] schedule", {
      tasks: schedule.tasks.length,
      sourceType: schedule.sourceType,
      warning: schedule.warning,
    });
  } catch (error) {
    console.error("[smoke] maintenance provider failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
