import { requireActiveUser } from "@/features/auth/services/session";
import {
  handleRouteError,
  jsonFail,
  jsonOk,
} from "@/features/auth/services/http";
import { listNotifications } from "@/features/notifications/services";

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser();
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const result = await listNotifications(user.id, query);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Création manuelle / broadcast admin — hors scope phase in-app. */
export async function POST() {
  return jsonFail("NOTIF_004", "Création manuelle non disponible", 403);
}
