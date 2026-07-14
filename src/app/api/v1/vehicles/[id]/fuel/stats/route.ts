import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getVehicleFuelStats } from "@/features/fuel/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const stats = await getVehicleFuelStats(user.id, id);
    return jsonOk({ stats });
  } catch (error) {
    return handleRouteError(error);
  }
}
