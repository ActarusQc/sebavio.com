import { NextResponse } from "next/server";
import { handleRouteError } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listCatalogModels } from "@/features/fuel-vehicle-catalog";
import { modelsQuerySchema } from "@/features/fuel-vehicle-catalog/schemas";
import { AppError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    await requireActiveUser();
    const url = new URL(request.url);
    const parsed = modelsQuerySchema.safeParse({
      year: url.searchParams.get("year"),
      make: url.searchParams.get("make"),
    });
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Paramètres invalides",
        400,
      );
    }
    const data = await listCatalogModels(parsed.data.year, parsed.data.make);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
