import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getModelKnownIssues } from "@/features/vehicle-catalog/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireActiveUser();
    const { id } = await context.params;
    const knownIssues = await getModelKnownIssues(id);
    return jsonOk({ knownIssues });
  } catch (error) {
    return handleRouteError(error);
  }
}
