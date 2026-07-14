import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getCampgroundById } from "@/features/campings/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireActiveUser();
    const { id } = await context.params;
    const campground = await getCampgroundById(id);
    return jsonOk({ campground });
  } catch (error) {
    return handleRouteError(error);
  }
}
