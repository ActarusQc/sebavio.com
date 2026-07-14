import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import {
  createActivity,
  listActivitiesAdmin,
} from "@/features/activities/services";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const url = new URL(request.url);
    const result = await listActivitiesAdmin({
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "20"),
      includeDeleted: url.searchParams.get("includeDeleted") === "true",
      q: url.searchParams.get("q") ?? undefined,
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const activity = await createActivity(body, admin.id, clientIp(request));
    return jsonOk({ activity }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
