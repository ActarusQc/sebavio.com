import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { geocodeStop } from "@/features/trips/services";

type RouteContext = { params: Promise<{ id: string; stopId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, stopId } = await context.params;
    const stop = await geocodeStop(user.id, id, stopId, clientIp(request));
    return jsonOk({ stop });
  } catch (error) {
    return handleRouteError(error);
  }
}
