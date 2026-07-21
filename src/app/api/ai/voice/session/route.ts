import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { createVoiceSession } from "@/features/ai/voice/services/sessions";

const bodySchema = z.object({
  tripId: z.string().uuid(),
  usageMode: z
    .enum(["conversation", "driving"])
    .optional()
    .default("conversation"),
  clientPlatform: z
    .enum(["web", "mobile", "android_auto", "carplay"])
    .optional()
    .default("web"),
});

/**
 * POST /api/ai/voice/session — démarre une session vocale.
 */
export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const json = await request.json();
    const body = bodySchema.parse(json);
    const session = await createVoiceSession({
      userId: user.id,
      tripId: body.tripId,
      usageMode: body.usageMode,
      clientPlatform: body.clientPlatform,
    });

    // Ne jamais inclure OPENAI_API_KEY ; clientSecret éphémère uniquement si Realtime.
    return jsonOk(session, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export function GET() {
  return NextResponse.json(
    { error: { code: "METHOD_NOT_ALLOWED", message: "Utilisez POST." } },
    { status: 405 },
  );
}
