import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getModelMaintenance } from "@/features/vehicle-catalog/services";

type RouteContext = { params: Promise<{ id: string }> };

/** Stub : templates d'entretien constructeur — module maintenance ultérieur. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireActiveUser();
    const { id } = await context.params;
    const maintenance = await getModelMaintenance(id);
    return jsonOk({ maintenance });
  } catch (error) {
    return handleRouteError(error);
  }
}
