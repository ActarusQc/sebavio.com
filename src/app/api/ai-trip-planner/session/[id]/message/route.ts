import { z } from "zod";
import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { sendPlanningMessage } from "@/features/ai-trip-planner/services/planner";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    content: z.string().optional(),
    quickReply: z.string().optional(),
  })
  .refine((v) => Boolean(v.content?.trim() || v.quickReply?.trim()), {
    message: "Message requis",
  });

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const body = bodySchema.parse(await request.json());
    const content = (body.content ?? body.quickReply ?? "").trim();
    const session = await sendPlanningMessage(user.id, id, content);
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}
