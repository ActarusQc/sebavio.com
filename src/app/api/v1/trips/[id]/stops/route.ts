import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { addStop } from "@/features/trips/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const stop = await addStop(user.id, id, body, clientIp(request));
    return jsonOk({ stop }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
