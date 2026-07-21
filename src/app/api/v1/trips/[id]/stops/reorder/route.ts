import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { stopReorderSchema } from "@/features/trips/schemas";
import { reorderStops } from "@/features/trips/services";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/v1/trips/:id/stops/reorder — réordonne les waypoints d'une direction. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = stopReorderSchema.parse(body);
    const trip = await reorderStops(
      user.id,
      id,
      parsed.direction,
      parsed.orderedIds,
      clientIp(request),
    );
    return jsonOk({ trip });
  } catch (error) {
    return handleRouteError(error);
  }
}
