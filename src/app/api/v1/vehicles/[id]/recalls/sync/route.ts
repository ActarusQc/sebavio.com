import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { assertMaintenanceExternalRateLimit } from "@/services/maintenance-schedule";
import { syncVehicleSafetyRecalls } from "@/services/safety-recalls";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    await assertMaintenanceExternalRateLimit(user.id, "recalls");
    const result = await syncVehicleSafetyRecalls(user.id, id);
    return jsonOk({ sync: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
