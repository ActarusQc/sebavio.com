import { NextResponse } from "next/server";
import { handleRouteError } from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import {
  invalidateCatalogSearchCache,
  syncVehicleCatalog,
} from "@/features/fuel-vehicle-catalog";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = (await request.json().catch(() => ({}))) as {
      force?: boolean;
    };
    const report = await syncVehicleCatalog({ force: body.force === true });
    await invalidateCatalogSearchCache();
    return NextResponse.json({ data: report });
  } catch (error) {
    return handleRouteError(error);
  }
}
