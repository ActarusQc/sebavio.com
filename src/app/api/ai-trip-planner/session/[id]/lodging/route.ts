import { z } from "zod";
import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { applyPlanningLodging } from "@/features/ai-trip-planner/services/apply-lodging";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  optionId: z.string().trim().min(1).max(80).optional(),
  optionName: z.string().trim().min(1).max(200).optional(),
  skip: z.boolean().optional().default(false),
  expectedVersion: z.number().int().nonnegative().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const body = bodySchema.parse(await request.json());
    const session = await applyPlanningLodging(user.id, id, body);
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}
