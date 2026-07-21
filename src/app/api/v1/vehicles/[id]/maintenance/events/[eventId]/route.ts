import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { updateProviderMaintenanceEvent } from "@/features/vehicle-maintenance";

type RouteContext = { params: Promise<{ id: string; eventId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, eventId } = await context.params;
    const body = await request.json();
    const event = await updateProviderMaintenanceEvent(
      user.id,
      id,
      eventId,
      body,
    );
    return jsonOk({ event });
  } catch (error) {
    return handleRouteError(error);
  }
}
