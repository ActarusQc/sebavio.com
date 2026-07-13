import { requireActiveUser } from "@/features/auth/services/session";
import { handleRouteError, jsonOk } from "@/features/auth/services/http";

export async function GET() {
  try {
    const user = await requireActiveUser();
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
