/**
 * Test live optionnel FDE — hors CI.
 *
 * Usage :
 *   npm run test:live:fde
 *
 * Ne journalise jamais la clé API.
 */
import { config } from "dotenv";

config({ path: ".env" });

async function main(): Promise<void> {
  const { loadFdeConfig, resetFdeConfigCache, resetFdeClient } =
    await import("../src/integrations/fde");
  const { estimateFuelCost } =
    await import("../src/features/fuel/services/fuel-cost-estimation");

  resetFdeConfigCache();
  resetFdeClient();

  const cfg = loadFdeConfig();
  if (!cfg.enabled) {
    throw new Error("FDE_ENABLED must be true");
  }
  if (!cfg.apiKey) {
    throw new Error("FDE_API_KEY missing");
  }

  console.log("[live-fde] baseUrl=", cfg.baseUrl);
  console.log("[live-fde] timeoutMs=", cfg.timeoutMs);
  console.log("[live-fde] apiKeyPresent=", cfg.apiKey.length > 0);

  const result = await estimateFuelCost({
    distanceKm: 100,
    consumptionLPer100Km: 10,
    fuelType: "regular",
    referencePosition: { latitude: 45.5017, longitude: -73.5673 },
    radiusKm: 10,
    bypassCache: true,
    regionHint: "Montréal",
  });

  const expectedCost =
    Math.round(result.estimatedLitres * result.priceCadPerLitre * 100) / 100;

  console.log(
    JSON.stringify(
      {
        distanceKm: result.distanceKm,
        estimatedLitres: result.estimatedLitres,
        priceCadPerLitre: result.priceCadPerLitre,
        estimatedCostCad: result.estimatedCostCad,
        expectedCostCad: expectedCost,
        mathOk: result.estimatedCostCad === expectedCost,
        pricingMethod: result.pricingMethod,
        stationCount: result.stationCount,
        fallbackUsed: result.fallbackUsed,
        freshness: result.freshness,
        source: result.source,
        observedAt: result.observedAt,
        warnings: result.warnings,
      },
      null,
      2,
    ),
  );

  if (result.estimatedCostCad !== expectedCost) {
    throw new Error("Math verification failed");
  }
  if (result.estimatedLitres !== 10) {
    throw new Error("Expected 10 litres");
  }

  console.log("[live-fde] OK");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    "[live-fde] FAIL:",
    message.replace(/fde_[A-Za-z0-9_]+/g, "[redacted]"),
  );
  process.exit(1);
});
