import { requireActiveUser } from "@/features/auth/services/session";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { changePassword } from "@/features/users/services";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    await changePassword(user.id, body, clientIp(request));
    return jsonOk({ changed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
