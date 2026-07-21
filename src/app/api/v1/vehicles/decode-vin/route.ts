import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { decodeVinSchema } from "@/features/vehicle-maintenance/schemas";
import { assertMaintenanceExternalRateLimit } from "@/services/maintenance-schedule";
import { decodeVinWithNhtsa } from "@/services/vin-decode";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    await assertMaintenanceExternalRateLimit(user.id, "vin");

    const body = await request.json();
    let vin: string;
    try {
      vin = decodeVinSchema.parse(body).vin;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          "VALIDATION_ERROR",
          error.issues[0]?.message ?? "VIN invalide",
          400,
        );
      }
      throw error;
    }

    const decoded = await decodeVinWithNhtsa(vin);
    void clientIp(request);

    return jsonOk({
      decoded,
      confirmationRequired: true,
      message: decoded.isCertain
        ? "Vérifiez les informations détectées avant d’enregistrer le véhicule."
        : "Résultat incomplet ou ambigu — confirmez ou corrigez les champs avant d’enregistrer.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
