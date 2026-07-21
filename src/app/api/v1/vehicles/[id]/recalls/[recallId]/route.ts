import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { recallStatusSchema } from "@/features/vehicle-maintenance/schemas";
import { updateVehicleSafetyRecall } from "@/services/safety-recalls";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string; recallId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, recallId } = await context.params;
    const body = await request.json();
    let status: ReturnType<typeof recallStatusSchema.parse>["status"];
    try {
      status = recallStatusSchema.parse(body).status;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          "VALIDATION_ERROR",
          error.issues[0]?.message ?? "Statut invalide",
          400,
        );
      }
      throw error;
    }
    const recall = await updateVehicleSafetyRecall(
      user.id,
      id,
      recallId,
      status,
    );
    return jsonOk({ recall });
  } catch (error) {
    return handleRouteError(error);
  }
}
