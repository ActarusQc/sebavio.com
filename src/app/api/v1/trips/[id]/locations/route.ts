import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  listTripLocations,
  recordTripLocations,
} from "@/features/trips/services/trip-locations";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/trips/:id/locations — batch de points GPS (propriétaire, in_progress).
 * GET  /api/v1/trips/:id/locations?since=&limit=
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const result = await recordTripLocations(user.id, id, body);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const url = new URL(request.url);
    const locations = await listTripLocations(user.id, id, {
      since: url.searchParams.get("since") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    return jsonOk({ locations });
  } catch (error) {
    return handleRouteError(error);
  }
}
