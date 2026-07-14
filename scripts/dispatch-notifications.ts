/**
 * CLI : npm run dispatch:notifications
 * Planification recommandée (déploiement) : toutes les heures via cron/PM2
 * (NotificationDispatcher — Doc 6).
 * Exemple crontab :
 *   15 * * * * cd /var/www/sebavio.com && npm run dispatch:notifications
 */
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const { dispatchNotifications } =
    await import("../src/features/notifications/services/dispatch");
  const report = await dispatchNotifications();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
