import { handleRouteError } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { optimizeTrip } from "@/features/trips/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    await optimizeTrip(user.id, id);
  } catch (error) {
    return handleRouteError(error);
  }
}
