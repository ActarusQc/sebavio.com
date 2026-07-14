import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { writeAuditLog } from "@/features/auth/services/audit";
import { ingestRegieFuelPrices } from "@/services/fuel-prices";

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    const report = await ingestRegieFuelPrices();
    await writeAuditLog({
      userId: user.id,
      entity: "fuel_ingestions",
      entityId: "regie",
      action: "ingest",
      newValue: {
        status: report.status,
        stationsProcessed: report.stationsProcessed,
        pricesInserted: report.pricesInserted,
        anomaly: report.anomaly ?? null,
      },
      ipAddress: clientIp(request),
    });
    const status =
      report.status === "success"
        ? 200
        : report.status === "refused"
          ? 429
          : 502;
    return jsonOk({ report }, status);
  } catch (error) {
    return handleRouteError(error);
  }
}
