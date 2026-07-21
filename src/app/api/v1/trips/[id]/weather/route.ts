import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getTripWeatherResponse } from "@/features/weather/services";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const liveQuerySchema = z.object({
  liveLat: z.coerce.number().finite().min(-90).max(90).optional(),
  liveLng: z.coerce.number().finite().min(-180).max(180).optional(),
});

/**
 * GET /api/v1/trips/:id/weather
 * Coordonnées voyage côté serveur ; liveLat/liveLng optionnels (propriétaire,
 * voyage in_progress) pour « Ma position » — ne modifient pas l'origine.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const url = new URL(request.url);
    const query = liveQuerySchema.parse({
      liveLat: url.searchParams.get("liveLat") ?? undefined,
      liveLng: url.searchParams.get("liveLng") ?? undefined,
    });
    const weather = await getTripWeatherResponse(user.id, id, {
      liveLatitude: query.liveLat,
      liveLongitude: query.liveLng,
    });
    return jsonOk({ weather });
  } catch (error) {
    return handleRouteError(error);
  }
}
