import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { createSessionBodySchema } from "@/features/ai-trip-planner/schemas/session";
import { resolveTripPlannerAccess } from "@/features/ai-trip-planner/services/access";
import {
  createSession,
  getActiveSession,
} from "@/features/ai-trip-planner/services/sessions";
import { toSessionDto } from "@/features/ai-trip-planner/services/dto";
import { loadPlannerUserContext } from "@/features/ai-trip-planner/services/user-context";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const access = await resolveTripPlannerAccess(user.id);
    const active = access.canUse ? await getActiveSession(user.id) : null;
    if (!active) {
      return jsonOk({ session: null, access });
    }
    const ctx = await loadPlannerUserContext(user.id);
    return jsonOk({
      session: toSessionDto(active, {
        originSuggestions: ctx.originSuggestions,
        homeCity: ctx.homeCity,
      }),
      access,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json().catch(() => ({}));
    const parsed = createSessionBodySchema.parse(body);
    const access = await resolveTripPlannerAccess(user.id);
    if (!access.canUse) {
      return jsonOk({ session: null, access });
    }
    const session = await createSession(user.id, {
      forceNew: parsed.forceNew,
    });
    void clientIp(request);
    return jsonOk({ session, access }, parsed.forceNew ? 201 : 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
