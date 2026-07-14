import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { recalculateSchema } from "@/features/maintenance/schemas";
import { recalculateVehicleSchedule } from "@/features/maintenance/services";
import { writeAuditLog } from "@/features/auth/services/audit";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    let vehicleId: string;
    try {
      vehicleId = recalculateSchema.parse(body).vehicleId;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          "VALIDATION_ERROR",
          error.issues[0]?.message ?? "Paramètres invalides",
          400,
        );
      }
      throw error;
    }

    const schedule = await recalculateVehicleSchedule(user.id, vehicleId);

    await writeAuditLog({
      userId: user.id,
      entity: "maintenance_schedule",
      entityId: vehicleId,
      action: "recalculate",
      newValue: { count: schedule.length },
      ipAddress: clientIp(request),
    });

    return jsonOk({ schedule });
  } catch (error) {
    return handleRouteError(error);
  }
}
