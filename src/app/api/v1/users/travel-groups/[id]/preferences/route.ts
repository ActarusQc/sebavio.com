import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  getPreferences,
  upsertPreferences,
} from "@/features/travel-groups/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const preferences = await getPreferences(user.id, id);
    return jsonOk({ preferences });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const preferences = await upsertPreferences(
      user.id,
      id,
      body,
      clientIp(request),
    );
    return jsonOk({ preferences });
  } catch (error) {
    return handleRouteError(error);
  }
}
