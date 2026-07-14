import { requireActiveUser } from "@/features/auth/services/session";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { getPreferences, updatePreferences } from "@/features/users/services";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const preferences = await getPreferences(user.id);
    return jsonOk({ preferences });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    const preferences = await updatePreferences(
      user.id,
      body,
      clientIp(request),
    );
    return jsonOk({ preferences });
  } catch (error) {
    return handleRouteError(error);
  }
}
