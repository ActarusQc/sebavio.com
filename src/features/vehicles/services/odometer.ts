import type { Prisma } from "@prisma/client";
import { AppError, type AppErrorCode } from "@/lib/errors";

/**
 * Règle commune odomètre (Parties 10 / 13) :
 * le kilométrage ne peut jamais diminuer.
 */
export function assertOdometerNotDecreasing(
  currentOdometer: number,
  newOdometer: number,
  code: AppErrorCode = "VEH_004",
): void {
  if (newOdometer < currentOdometer) {
    throw new AppError(code, "Kilométrage invalide", 400);
  }
}

/**
 * Met à jour current_odometer / odometer_updated_at si le nouveau
 * kilométrage est strictement supérieur.
 */
export async function bumpOdometerIfHigher(
  tx: Prisma.TransactionClient,
  vehicleId: string,
  currentOdometer: number,
  newOdometer: number,
): Promise<void> {
  if (newOdometer > currentOdometer) {
    await tx.userVehicle.update({
      where: { id: vehicleId },
      data: {
        currentOdometer: newOdometer,
        odometerUpdatedAt: new Date(),
      },
    });
  }
}
