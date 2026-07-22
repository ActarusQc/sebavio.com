import { ZodError } from "zod";
import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { AppError } from "@/lib/errors";
import {
  assertSpecsEstimateRateLimit,
  estimateVehicleSpecs,
} from "@/features/vehicles/services/specs-estimate";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    await assertSpecsEstimateRateLimit(user.id);

    const body = await request.json();
    try {
      const result = await estimateVehicleSpecs(body);
      return jsonOk(result);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          "VALIDATION_ERROR",
          error.issues[0]?.message ?? "Demande d’estimation invalide",
          400,
        );
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
