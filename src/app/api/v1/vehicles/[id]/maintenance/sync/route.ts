import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { maintenanceSyncSchema } from "@/features/vehicle-maintenance/schemas";
import { assertMaintenanceExternalRateLimit } from "@/services/maintenance-schedule";
import { syncVehicleMaintenanceSchedule } from "@/services/maintenance-schedule/sync";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    await assertMaintenanceExternalRateLimit(user.id, "maintenance");

    const body = await request.json().catch(() => ({}));
    let forceRefresh = false;
    try {
      forceRefresh = maintenanceSyncSchema.parse(body).forceRefresh;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          "VALIDATION_ERROR",
          error.issues[0]?.message ?? "Requête invalide",
          400,
        );
      }
      throw error;
    }

    const result = await syncVehicleMaintenanceSchedule(user.id, id, {
      forceRefresh,
    });
    return jsonOk({ sync: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
