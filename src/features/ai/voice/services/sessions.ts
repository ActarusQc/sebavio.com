import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import { getOwnedTripOrThrow } from "@/features/trips/services/trips";
import { assertVoiceAllowed } from "@/features/ai/voice/access";
import {
  getOpenAiApiKeyForRealtime,
  getVoiceRuntimeConfig,
  resolveEffectiveVoiceProvider,
} from "@/features/ai/voice/config";
import { buildVoiceChannelInstructions } from "@/features/ai/voice/prompts";
import {
  getMonthlyVoiceSeconds,
  recordVoiceUsageEvent,
} from "@/features/ai/voice/services/usage";
import {
  VOICE_ASK_PATH,
  VOICE_SESSION_PATH,
} from "@/features/ai/voice/constants";
import type {
  VoiceClientPlatform,
  VoiceProviderName,
  VoiceUsageMode,
} from "@/features/ai/voice/types";

function buildPseudonymId(userId: string): string {
  const salt =
    process.env.VOICE_PSEUDONYM_SALT?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "sebavio-voice";
  return createHash("sha256")
    .update(`${userId}:${salt}`)
    .digest("hex")
    .slice(0, 32);
}

async function assertVoiceSessionRateLimit(userId: string): Promise<void> {
  const config = getVoiceRuntimeConfig();
  const key = `voice:rl:${userId}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, config.sessionRateLimitWindowSeconds);
    }

    if (count > config.sessionRateLimitMax) {
      throw new AppError(
        "VOICE_RATE_LIMIT",
        "Trop de sessions vocales. Réessayez un peu plus tard.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "VOICE_DISABLED",
      "L’agent vocal est temporairement indisponible.",
      503,
    );
  }
}

async function createRealtimeClientSecret(params: {
  model: string;
  voice: string;
  usageMode: VoiceUsageMode;
  language: string;
}): Promise<string> {
  const apiKey = getOpenAiApiKeyForRealtime();
  if (!apiKey) {
    throw new AppError(
      "VOICE_CONFIGURATION",
      "L’agent vocal Realtime n’est pas configuré (clé API manquante).",
      503,
    );
  }

  const instructions = `Tu es le pont vocal Sebavio. Langue: ${params.language}.
Utilise l’outil ask_sebavio pour toute question métier sur le voyage.
Ne réponds pas avec des connaissances inventées hors de ask_sebavio.
${buildVoiceChannelInstructions(params.usageMode)}`;

  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      voice: params.voice,
      modalities: ["audio", "text"],
      instructions,
      tools: [
        {
          type: "function",
          name: "ask_sebavio",
          description:
            "Pose une question à l’assistant Sebavio (cerveau métier).",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "Message utilisateur à transmettre.",
              },
            },
            required: ["message"],
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new AppError(
      "VOICE_CONFIGURATION",
      "Impossible de démarrer la session vocale Realtime.",
      502,
    );
  }

  const data = (await res.json()) as {
    client_secret?: { value?: string };
  };
  const secret = data.client_secret?.value;
  if (!secret) {
    throw new AppError(
      "VOICE_CONFIGURATION",
      "Réponse Realtime invalide (secret manquant).",
      502,
    );
  }
  return secret;
}

export type CreateVoiceSessionResult = {
  sessionId: string;
  provider: VoiceProviderName;
  expiresAt: string;
  clientSecret?: string;
  realtimeModel?: string;
  realtimeVoice?: string;
  language: string;
  askPath: string;
  endPath: string;
  heartbeatPath: string;
  monthlySecondsUsed: number;
  monthlySecondsLimit: number;
  usageMode: VoiceUsageMode;
  clientPlatform: VoiceClientPlatform;
};

export async function createVoiceSession(params: {
  userId: string;
  tripId: string;
  usageMode?: VoiceUsageMode;
  clientPlatform?: VoiceClientPlatform;
}): Promise<CreateVoiceSessionResult> {
  const usageMode = params.usageMode ?? "conversation";
  const clientPlatform = params.clientPlatform ?? "web";
  const config = getVoiceRuntimeConfig();

  const access = await assertVoiceAllowed(params.userId, clientPlatform);
  await assertVoiceSessionRateLimit(params.userId);
  await getOwnedTripOrThrow(params.userId, params.tripId);

  await invalidateExpiredSessions(params.userId);

  const activeCount = await prisma.aiVoiceSession.count({
    where: {
      userId: params.userId,
      status: "active",
      expiresAt: { gt: new Date() },
    },
  });

  if (activeCount >= config.maxConcurrentSessions) {
    throw new AppError(
      "VOICE_CONCURRENT",
      "Une session vocale est déjà active. Terminez-la avant d’en démarrer une autre.",
      409,
    );
  }

  const monthlySecondsUsed = await getMonthlyVoiceSeconds(params.userId);
  if (monthlySecondsUsed >= config.maxMonthlySeconds) {
    throw new AppError(
      "VOICE_MONTHLY_LIMIT",
      "Votre limite mensuelle d’utilisation vocale est atteinte.",
      429,
    );
  }

  let provider: VoiceProviderName;
  try {
    provider = resolveEffectiveVoiceProvider();
  } catch (error) {
    if (
      error instanceof AppError &&
      config.configuredProvider === "openai_realtime"
    ) {
      throw error;
    }
    provider = "pipeline";
  }

  let clientSecret: string | undefined;
  if (provider === "openai_realtime") {
    clientSecret = await createRealtimeClientSecret({
      model: config.realtimeModel,
      voice: config.realtimeVoice,
      usageMode,
      language: config.defaultLanguage,
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.maxSessionSeconds * 1000);
  const sessionId = randomUUID();

  await prisma.aiVoiceSession.create({
    data: {
      id: sessionId,
      userId: params.userId,
      tripId: params.tripId,
      usageMode,
      clientPlatform,
      provider,
      status: "active",
      pseudonymId: buildPseudonymId(params.userId),
      expiresAt,
    },
  });

  await recordVoiceUsageEvent({
    userId: params.userId,
    sessionId,
    tripId: params.tripId,
    eventType: "session_start",
    secondsDelta: 0,
    planSlug: access.access.planSlug,
    provider,
    clientPlatform,
    usageMode,
  });

  const endPath = `${VOICE_SESSION_PATH}/${sessionId}`;

  return {
    sessionId,
    provider,
    expiresAt: expiresAt.toISOString(),
    ...(clientSecret ? { clientSecret } : {}),
    ...(provider === "openai_realtime"
      ? {
          realtimeModel: config.realtimeModel,
          realtimeVoice: config.realtimeVoice,
        }
      : {}),
    language: config.defaultLanguage,
    askPath: VOICE_ASK_PATH,
    endPath,
    heartbeatPath: endPath,
    monthlySecondsUsed,
    monthlySecondsLimit: config.maxMonthlySeconds,
    usageMode,
    clientPlatform,
  };
}

export async function getActiveVoiceSession(sessionId: string, userId: string) {
  const session = await prisma.aiVoiceSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) {
    throw new AppError("VOICE_SESSION", "Session vocale introuvable.", 404);
  }
  return session;
}

export async function endVoiceSession(
  sessionId: string,
  userId: string,
  reason: string,
  metrics?: {
    userAudioSeconds?: number;
    assistantAudioSeconds?: number;
    interruptionCount?: number;
    errorCount?: number;
    durationSeconds?: number;
  },
): Promise<void> {
  const session = await getActiveVoiceSession(sessionId, userId);
  if (session.status !== "active") {
    return;
  }

  const now = new Date();
  const durationSeconds =
    metrics?.durationSeconds ??
    Math.max(
      0,
      Math.round((now.getTime() - session.startedAt.getTime()) / 1000),
    );

  await prisma.aiVoiceSession.update({
    where: { id: sessionId },
    data: {
      status: "ended",
      endedAt: now,
      endReason: reason.slice(0, 60),
      durationSeconds,
      userAudioSeconds: metrics?.userAudioSeconds ?? session.userAudioSeconds,
      assistantAudioSeconds:
        metrics?.assistantAudioSeconds ?? session.assistantAudioSeconds,
      interruptionCount:
        metrics?.interruptionCount ?? session.interruptionCount,
      errorCount: metrics?.errorCount ?? session.errorCount,
    },
  });

  await recordVoiceUsageEvent({
    userId,
    sessionId,
    tripId: session.tripId,
    eventType: "session_end",
    secondsDelta: durationSeconds,
    provider: session.provider,
    clientPlatform: session.clientPlatform,
    usageMode: session.usageMode,
  });
}

export async function heartbeatVoiceSession(
  sessionId: string,
  userId: string,
  metrics?: {
    userAudioSeconds?: number;
    assistantAudioSeconds?: number;
    interruptionCount?: number;
    errorCount?: number;
    secondsDelta?: number;
  },
): Promise<{ expiresAt: string; status: string }> {
  const session = await getActiveVoiceSession(sessionId, userId);

  if (session.status !== "active") {
    throw new AppError(
      "VOICE_SESSION",
      "Cette session vocale est terminée.",
      409,
    );
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await endVoiceSession(sessionId, userId, "expired");
    throw new AppError("VOICE_SESSION", "La session vocale a expiré.", 410);
  }

  const data: {
    userAudioSeconds?: number;
    assistantAudioSeconds?: number;
    interruptionCount?: number;
    errorCount?: number;
  } = {};
  if (metrics?.userAudioSeconds != null) {
    data.userAudioSeconds = metrics.userAudioSeconds;
  }
  if (metrics?.assistantAudioSeconds != null) {
    data.assistantAudioSeconds = metrics.assistantAudioSeconds;
  }
  if (metrics?.interruptionCount != null) {
    data.interruptionCount = metrics.interruptionCount;
  }
  if (metrics?.errorCount != null) {
    data.errorCount = metrics.errorCount;
  }

  if (Object.keys(data).length > 0) {
    await prisma.aiVoiceSession.update({
      where: { id: sessionId },
      data,
    });
  }

  if ((metrics?.secondsDelta ?? 0) > 0) {
    await recordVoiceUsageEvent({
      userId,
      sessionId,
      tripId: session.tripId,
      eventType: "heartbeat",
      secondsDelta: metrics!.secondsDelta!,
      provider: session.provider,
      clientPlatform: session.clientPlatform,
      usageMode: session.usageMode,
    });
  }

  return {
    expiresAt: session.expiresAt.toISOString(),
    status: "active",
  };
}

export async function invalidateExpiredSessions(
  userId?: string,
): Promise<number> {
  const where = {
    status: "active",
    expiresAt: { lte: new Date() },
    ...(userId ? { userId } : {}),
  };

  const expired = await prisma.aiVoiceSession.findMany({
    where,
    select: {
      id: true,
      userId: true,
      tripId: true,
      provider: true,
      clientPlatform: true,
      usageMode: true,
      startedAt: true,
    },
  });

  if (expired.length === 0) return 0;

  const now = new Date();
  await prisma.aiVoiceSession.updateMany({
    where: { id: { in: expired.map((s) => s.id) } },
    data: {
      status: "ended",
      endedAt: now,
      endReason: "expired",
    },
  });

  for (const s of expired) {
    const durationSeconds = Math.max(
      0,
      Math.round((now.getTime() - s.startedAt.getTime()) / 1000),
    );
    await recordVoiceUsageEvent({
      userId: s.userId,
      sessionId: s.id,
      tripId: s.tripId,
      eventType: "session_end",
      secondsDelta: durationSeconds,
      provider: s.provider,
      clientPlatform: s.clientPlatform,
      usageMode: s.usageMode,
      errorCode: "expired",
    });
  }

  return expired.length;
}
