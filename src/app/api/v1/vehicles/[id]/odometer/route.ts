import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { updateOdometer } from "@/features/vehicles/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const vehicle = await updateOdometer(user.id, id, body, clientIp(request));
    return jsonOk({ vehicle });
  } catch (error) {
    return handleRouteError(error);
  }
}
