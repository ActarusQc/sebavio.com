/**
 * CLI : npm run vehicle-catalog:sync
 * Import initial / périodique des cotes NRCan.
 *
 * Crontab recommandé (hebdomadaire, dimanche 03:30) :
 *   30 3 * * 0 cd /var/www/sebavio.com && . ~/.nvm/nvm.sh && nvm use && npm run vehicle-catalog:sync >> /var/log/sebavio-vehicle-catalog-sync.log 2>&1
 *
 * Options :
 *   --force  ignore les checksums et réimporte toutes les ressources
 */
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const force = process.argv.includes("--force");
  const { syncVehicleCatalog, invalidateCatalogSearchCache } =
    await import("../src/features/fuel-vehicle-catalog");
  const report = await syncVehicleCatalog({ force });
  console.log(JSON.stringify(report, null, 2));
  // Best-effort : ne doit jamais bloquer la CLI
  await Promise.race([
    invalidateCatalogSearchCache(),
    new Promise((r) => setTimeout(r, 2000)),
  ]);
  if (report.status === "failed") {
    process.exitCode = 1;
  } else if (report.status === "partial") {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
