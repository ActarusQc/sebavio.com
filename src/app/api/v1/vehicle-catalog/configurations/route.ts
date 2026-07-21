import { NextResponse } from "next/server";
import { handleRouteError } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listCatalogConfigurations } from "@/features/fuel-vehicle-catalog";
import { configurationsQuerySchema } from "@/features/fuel-vehicle-catalog/schemas";
import { AppError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    await requireActiveUser();
    const url = new URL(request.url);
    const parsed = configurationsQuerySchema.safeParse({
      year: url.searchParams.get("year"),
      make: url.searchParams.get("make"),
      model: url.searchParams.get("model"),
    });
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Paramètres invalides",
        400,
      );
    }
    const data = await listCatalogConfigurations(parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
