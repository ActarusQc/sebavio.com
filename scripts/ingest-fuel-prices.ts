/**
 * CLI : npm run ingest:fuel-prices
 * Planification recommandée (déploiement) : toutes les 2–4 h via cron/PM2.
 * Exemple crontab :
 *   0 star/3 star star star cd /var/www/sebavio.com && npm run ingest:fuel-prices
 * (remplacer star par *)
 */
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const { ingestRegieFuelPrices } = await import("../src/services/fuel-prices");
  const report = await ingestRegieFuelPrices();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "success") {
    process.exitCode = report.status === "refused" ? 2 : 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
