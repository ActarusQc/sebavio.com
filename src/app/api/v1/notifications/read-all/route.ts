import { requireActiveUser } from "@/features/auth/services/session";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { markAllNotificationsRead } from "@/features/notifications/services";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const result = await markAllNotificationsRead(user.id, clientIp(request));
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
