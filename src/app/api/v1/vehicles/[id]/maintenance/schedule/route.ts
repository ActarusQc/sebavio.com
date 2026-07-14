import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listVehicleSchedule } from "@/features/maintenance/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const schedule = await listVehicleSchedule(user.id, id);
    return jsonOk({ schedule });
  } catch (error) {
    return handleRouteError(error);
  }
}
