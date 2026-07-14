import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  deleteHistory,
  getHistoryById,
  updateHistory,
} from "@/features/maintenance/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const history = await getHistoryById(user.id, id);
    return jsonOk({ history });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const history = await updateHistory(user.id, id, body, clientIp(request));
    return jsonOk({ history });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    await deleteHistory(user.id, id, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
