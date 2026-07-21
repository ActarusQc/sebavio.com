import { z } from "zod";
import {
  handleRouteError,
  jsonFail,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getActiveVoiceSession } from "@/features/ai/voice/services/sessions";
import { runVoiceAsk } from "@/features/ai/voice/services/voice-ask";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  tripId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  liveLatitude: z.number().min(-90).max(90).nullable().optional(),
  liveLongitude: z.number().min(-180).max(180).nullable().optional(),
});

/**
 * POST /api/ai/voice/ask — pont vers runTripAssistant (channel=voice).
 */
export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = bodySchema.parse(await request.json());

    const session = await getActiveVoiceSession(body.sessionId, user.id);
    if (session.status !== "active") {
      throw new AppError(
        "VOICE_SESSION",
        "Cette session vocale est terminée.",
        409,
      );
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new AppError("VOICE_SESSION", "La session vocale a expiré.", 410);
    }
    if (session.tripId !== body.tripId) {
      throw new AppError(
        "VOICE_SESSION",
        "La session vocale ne correspond pas à ce voyage.",
        400,
      );
    }

    const usageMode =
      session.usageMode === "driving" ? "driving" : "conversation";

    const result = await runVoiceAsk({
      userId: user.id,
      tripId: body.tripId,
      message: body.message,
      usageMode,
      includeLiveLocation:
        body.liveLatitude != null && body.liveLongitude != null,
      liveLatitude: body.liveLatitude ?? null,
      liveLongitude: body.liveLongitude ?? null,
    });

    if (!result.ok) {
      return jsonFail(result.code, result.message, 400);
    }

    if (result.conversationId) {
      await prisma.aiVoiceSession.update({
        where: { id: session.id },
        data: { conversationId: result.conversationId },
      });
    }

    return jsonOk({
      spokenText: result.spokenText,
      displayAnswer: result.displayAnswer,
      structured: result.structured,
      conversationId: result.conversationId,
      confirmationRequired: result.confirmationRequired,
      proposedAction: result.proposedAction,
      mode: result.mode,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
