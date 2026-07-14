import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listVehicleMaintenance } from "@/features/vehicles/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const data = await listVehicleMaintenance(user.id, id);
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
