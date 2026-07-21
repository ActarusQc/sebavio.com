import { NextResponse } from "next/server";
import { handleRouteError } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listCatalogMakes } from "@/features/fuel-vehicle-catalog";
import { makesQuerySchema } from "@/features/fuel-vehicle-catalog/schemas";
import { AppError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    await requireActiveUser();
    const url = new URL(request.url);
    const parsed = makesQuerySchema.safeParse({
      year: url.searchParams.get("year"),
    });
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Paramètres invalides",
        400,
      );
    }
    const data = await listCatalogMakes(parsed.data.year);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
