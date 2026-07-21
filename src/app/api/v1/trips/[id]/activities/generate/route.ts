import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { generateTripActivitySuggestions } from "@/features/trips/activities/trip-activity-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const result = await generateTripActivitySuggestions(
      user.id,
      id,
      body,
      clientIp(request),
    );
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
