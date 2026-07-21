import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { applyPlanningPlace } from "@/features/ai-trip-planner/services/apply-place";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const body = await request.json();
    const session = await applyPlanningPlace(user.id, id, body);
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}
