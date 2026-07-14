import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getModelDocuments } from "@/features/vehicle-catalog/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireActiveUser();
    const { id } = await context.params;
    const documents = await getModelDocuments(id);
    return jsonOk({ documents });
  } catch (error) {
    return handleRouteError(error);
  }
}
