/**
 * Synchronisation périodique des rappels de sécurité Transport Canada.
 * Cron recommandé (hebdomadaire) : 0 4 * * 1
 *
 *   npm run recalls:sync
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { syncVehicleSafetyRecalls } from "@/services/safety-recalls";

async function main() {
  const vehicles = await prisma.userVehicle.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      userId: true,
      manualYear: true,
      manualManufacturerName: true,
      manualModelName: true,
    },
    take: 500,
  });

  let ok = 0;
  let fail = 0;

  for (const v of vehicles) {
    try {
      await syncVehicleSafetyRecalls(v.userId, v.id);
      ok += 1;
    } catch (error) {
      fail += 1;
      console.error("[recalls:sync] vehicle failed", {
        vehicleId: v.id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  console.info("[recalls:sync] done", { total: vehicles.length, ok, fail });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
