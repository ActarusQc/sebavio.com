import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getProviderMaintenanceDashboard } from "@/features/vehicle-maintenance";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const dashboard = await getProviderMaintenanceDashboard(user.id, id);
    return jsonOk({ maintenance: dashboard });
  } catch (error) {
    return handleRouteError(error);
  }
}
