import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { attachActivityToStop } from "@/features/activities/services";
import { attachActivitySchema } from "@/features/activities/schemas";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string; stopId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, stopId } = await context.params;
    const { getTripById } = await import("@/features/trips/services");
    const trip = await getTripById(user.id, id);
    const stop = trip.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new AppError("TRIP_001", "Voyage introuvable", 404);
    }
    return jsonOk({
      activities: stop.activities,
      activityCount: stop.activityCount,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, stopId } = await context.params;
    const body = await request.json();
    let parsed;
    try {
      parsed = attachActivitySchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          "VALIDATION_ERROR",
          error.issues[0]?.message ?? "Payload invalide",
          400,
        );
      }
      throw error;
    }
    const result = await attachActivityToStop(
      user.id,
      id,
      stopId,
      parsed.activityId,
      parsed.notes,
      clientIp(request),
    );
    return jsonOk({ attachment: result }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
