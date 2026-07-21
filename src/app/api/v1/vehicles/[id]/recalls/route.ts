import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listVehicleSafetyRecalls } from "@/services/safety-recalls";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const recalls = await listVehicleSafetyRecalls(user.id, id);
    return jsonOk({ recalls });
  } catch (error) {
    return handleRouteError(error);
  }
}
