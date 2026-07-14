import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { weatherLocationQuerySchema } from "@/features/weather/schemas";
import { getForecastForLocation } from "@/features/weather/services";
import { AppError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser();
    const url = new URL(request.url);
    const parsed = weatherLocationQuerySchema.safeParse({
      latitude: url.searchParams.get("latitude"),
      longitude: url.searchParams.get("longitude"),
    });
    if (!parsed.success) {
      throw new AppError("EXT_002", "Position invalide ou introuvable", 400);
    }
    const data = await getForecastForLocation(
      user.id,
      parsed.data.latitude,
      parsed.data.longitude,
    );
    return jsonOk({ forecast: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
