import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { removeFavorite } from "@/features/campings/services";

type RouteContext = { params: Promise<{ id: string }> };

/** DELETE /api/v1/campgrounds/favorites/{campgroundId} */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    await removeFavorite(user.id, id, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
