import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { addFavorite, listFavorites } from "@/features/activities/services";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const items = await listFavorites(user.id);
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    const favorite = await addFavorite(user.id, body, clientIp(request));
    return jsonOk({ favorite }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
