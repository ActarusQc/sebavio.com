import { requireActiveUser } from "@/features/auth/services/session";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { markNotificationRead } from "@/features/notifications/services";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const notification = await markNotificationRead(
      user.id,
      id,
      clientIp(request),
    );
    return jsonOk({ notification });
  } catch (error) {
    return handleRouteError(error);
  }
}
