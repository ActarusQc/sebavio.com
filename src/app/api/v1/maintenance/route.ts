import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { createHistory, listHistory } from "@/features/maintenance/services";

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser();
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const data = await listHistory(user.id, query);
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    const history = await createHistory(user.id, body, clientIp(request));
    return jsonOk({ history }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
