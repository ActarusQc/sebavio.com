import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { applyOdometerFromTrip } from "@/features/vehicle-maintenance";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const result = await applyOdometerFromTrip(user.id, id, body);
    return jsonOk({ odometer: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
