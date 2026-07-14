import { requireActiveUser } from "@/features/auth/services/session";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import {
  getCurrentUserWithProfile,
  updateProfile,
} from "@/features/users/services";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const data = await getCurrentUserWithProfile(user.id);
    return jsonOk({ user: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    const profile = await updateProfile(user.id, body, clientIp(request));
    return jsonOk({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
