import { NextResponse } from "next/server";
import { handleRouteError } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getCatalogEntryById } from "@/features/fuel-vehicle-catalog";
import { catalogIdParamSchema } from "@/features/fuel-vehicle-catalog/schemas";
import { AppError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireActiveUser();
    const { id } = await context.params;
    const parsed = catalogIdParamSchema.safeParse({ id });
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Identifiant invalide", 400);
    }
    const data = await getCatalogEntryById(parsed.data.id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
