import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getActivityById } from "@/features/activities/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireActiveUser();
    const { id } = await context.params;
    const activity = await getActivityById(id);
    return jsonOk({ activity });
  } catch (error) {
    return handleRouteError(error);
  }
}
