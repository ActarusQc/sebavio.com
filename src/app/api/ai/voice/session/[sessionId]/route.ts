import { z } from "zod";
import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  endVoiceSession,
  heartbeatVoiceSession,
} from "@/features/ai/voice/services/sessions";

type RouteContext = { params: Promise<{ sessionId: string }> };

const patchSchema = z.object({
  userAudioSeconds: z.number().int().min(0).optional(),
  assistantAudioSeconds: z.number().int().min(0).optional(),
  interruptionCount: z.number().int().min(0).optional(),
  errorCount: z.number().int().min(0).optional(),
  secondsDelta: z.number().int().min(0).optional(),
});

const deleteSchema = z.object({
  reason: z.string().min(1).max(60).optional().default("user_quit"),
  userAudioSeconds: z.number().int().min(0).optional(),
  assistantAudioSeconds: z.number().int().min(0).optional(),
  interruptionCount: z.number().int().min(0).optional(),
  errorCount: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
});

/**
 * PATCH /api/ai/voice/session/:sessionId — heartbeat / métriques.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { sessionId } = await context.params;
    const body = patchSchema.parse(await request.json().catch(() => ({})));
    const result = await heartbeatVoiceSession(sessionId, user.id, body);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE /api/ai/voice/session/:sessionId — termine la session.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { sessionId } = await context.params;
    let body: z.infer<typeof deleteSchema> = { reason: "user_quit" };
    try {
      const raw = await request.json();
      body = deleteSchema.parse(raw);
    } catch {
      body = { reason: "user_quit" };
    }
    await endVoiceSession(sessionId, user.id, body.reason, {
      userAudioSeconds: body.userAudioSeconds,
      assistantAudioSeconds: body.assistantAudioSeconds,
      interruptionCount: body.interruptionCount,
      errorCount: body.errorCount,
      durationSeconds: body.durationSeconds,
    });
    return jsonOk({ ended: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
