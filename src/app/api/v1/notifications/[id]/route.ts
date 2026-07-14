import { requireActiveUser } from "@/features/auth/services/session";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import {
  deleteNotification,
  getNotificationById,
} from "@/features/notifications/services";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const notification = await getNotificationById(user.id, id);
    return jsonOk({ notification });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    await deleteNotification(user.id, id, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
