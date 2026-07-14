import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { deleteStop, updateStop } from "@/features/trips/services";

type RouteContext = { params: Promise<{ id: string; stopId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, stopId } = await context.params;
    const body = await request.json();
    const stop = await updateStop(user.id, id, stopId, body, clientIp(request));
    return jsonOk({ stop });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, stopId } = await context.params;
    await deleteStop(user.id, id, stopId, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
