import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { AppError } from "@/lib/errors";
import { getLatestTripLocation } from "@/features/trips/services/trip-locations";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/trips/:id/locations/latest
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const latest = await getLatestTripLocation(user.id, id);
    if (!latest) {
      throw new AppError("TRIP_001", "Aucune position enregistrée", 404);
    }
    return jsonOk({ location: latest });
  } catch (error) {
    return handleRouteError(error);
  }
}
