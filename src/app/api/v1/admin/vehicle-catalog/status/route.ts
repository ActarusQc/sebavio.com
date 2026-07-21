import { NextResponse } from "next/server";
import { handleRouteError } from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { getCatalogStats } from "@/features/fuel-vehicle-catalog";

export async function GET() {
  try {
    await requireAdminUser();
    const stats = await getCatalogStats();
    const last = stats.lastSync;
    return NextResponse.json({
      data: {
        totalVehicles: stats.totalActive,
        yearsCovered: stats.years,
        yearMin: stats.yearMin,
        yearMax: stats.yearMax,
        lastSync: last
          ? {
              id: last.id,
              status: last.status,
              startedAt: last.startedAt.toISOString(),
              completedAt: last.completedAt?.toISOString() ?? null,
              durationMs:
                last.completedAt != null
                  ? last.completedAt.getTime() - last.startedAt.getTime()
                  : null,
              recordsRead: last.recordsRead,
              recordsCreated: last.recordsCreated,
              recordsUpdated: last.recordsUpdated,
              recordsUnchanged: last.recordsUnchanged,
              recordsRejected: last.recordsRejected,
              errorMessage: last.errorMessage,
              sourceDataset: last.sourceDataset,
              metadata: last.metadata,
            }
          : null,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
