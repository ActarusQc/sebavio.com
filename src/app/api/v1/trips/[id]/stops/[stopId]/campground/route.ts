import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { attachCampgroundToStop } from "@/features/campings/services";
import { attachCampgroundSchema } from "@/features/campings/schemas";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string; stopId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, stopId } = await context.params;
    const body = await request.json();
    let parsed;
    try {
      parsed = attachCampgroundSchema.parse(body);
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
    const result = await attachCampgroundToStop(
      user.id,
      id,
      stopId,
      parsed.campgroundId ?? null,
      clientIp(request),
    );
    return jsonOk({ attachment: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
