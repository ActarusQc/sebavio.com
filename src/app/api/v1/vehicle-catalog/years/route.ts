import { NextResponse } from "next/server";
import { handleRouteError } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listCatalogYears } from "@/features/fuel-vehicle-catalog";

export async function GET() {
  try {
    await requireActiveUser();
    const data = await listCatalogYears();
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
