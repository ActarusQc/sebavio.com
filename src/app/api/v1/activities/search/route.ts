import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { searchActivities } from "@/features/activities/services";

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser();
    const url = new URL(request.url);
    const query: Record<string, string | undefined> = {};
    for (const key of url.searchParams.keys()) {
      query[key] = url.searchParams.get(key) ?? undefined;
    }
    const result = await searchActivities(user.id, query);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
