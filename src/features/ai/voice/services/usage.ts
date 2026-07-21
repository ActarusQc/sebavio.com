import "server-only";

import { prisma } from "@/lib/prisma";
import { getVoiceRuntimeConfig } from "@/features/ai/voice/config";

export type VoiceUsageEventType =
  "session_start" | "session_end" | "heartbeat" | "error";

export type RecordVoiceUsageInput = {
  userId: string;
  sessionId?: string | null;
  tripId?: string | null;
  eventType: VoiceUsageEventType;
  secondsDelta?: number;
  planSlug?: string | null;
  provider?: string | null;
  clientPlatform?: string | null;
  usageMode?: string | null;
  errorCode?: string | null;
};

export async function recordVoiceUsageEvent(
  input: RecordVoiceUsageInput,
): Promise<void> {
  try {
    await prisma.aiVoiceUsage.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId ?? null,
        tripId: input.tripId ?? null,
        eventType: input.eventType,
        secondsDelta: input.secondsDelta ?? 0,
        planSlug: input.planSlug ?? null,
        provider: input.provider ?? null,
        clientPlatform: input.clientPlatform ?? null,
        usageMode: input.usageMode ?? null,
        errorCode: input.errorCode ?? null,
      },
    });
  } catch {
    console.error("[voice] failed to record usage", {
      eventType: input.eventType,
      errorCode: input.errorCode,
    });
  }
}

/** Somme des seconds_delta du mois calendaire UTC courant. */
export async function getMonthlyVoiceSeconds(userId: string): Promise<number> {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );

  const agg = await prisma.aiVoiceUsage.aggregate({
    where: {
      userId,
      createdAt: { gte: start },
      secondsDelta: { gt: 0 },
    },
    _sum: { secondsDelta: true },
  });

  return agg._sum.secondsDelta ?? 0;
}

export type VoiceAdminMetrics = {
  enabled: boolean;
  provider: string;
  configuredProvider: string;
  apiKeyPresent: boolean;
  webEnabled: boolean;
  mobileEnabled: boolean;
  androidAutoEnabled: boolean;
  carplayEnabled: boolean;
  maxSessionSeconds: number;
  maxMonthlySeconds: number;
  totals: {
    sessions: number;
    usageEvents: number;
    totalSeconds: number;
    errors: number;
    activeSessions: number;
  };
  byDay: Array<{ day: string; sessions: number; seconds: number }>;
  byPlatform: Array<{ platform: string; count: number }>;
  byProvider: Array<{ provider: string; count: number }>;
};

export async function getVoiceAdminMetrics(
  days = 30,
): Promise<VoiceAdminMetrics> {
  const config = getVoiceRuntimeConfig();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const [sessions, usages, activeSessions] = await Promise.all([
    prisma.aiVoiceSession.findMany({
      where: { startedAt: { gte: since } },
      select: {
        id: true,
        startedAt: true,
        durationSeconds: true,
        clientPlatform: true,
        provider: true,
        errorCount: true,
      },
    }),
    prisma.aiVoiceUsage.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        secondsDelta: true,
        eventType: true,
        clientPlatform: true,
        provider: true,
      },
    }),
    prisma.aiVoiceSession.count({
      where: { status: "active", expiresAt: { gt: new Date() } },
    }),
  ]);

  const dayMap = new Map<string, { sessions: number; seconds: number }>();
  for (const s of sessions) {
    const day = s.startedAt.toISOString().slice(0, 10);
    const cur = dayMap.get(day) ?? { sessions: 0, seconds: 0 };
    cur.sessions += 1;
    cur.seconds += s.durationSeconds;
    dayMap.set(day, cur);
  }

  const platformMap = new Map<string, number>();
  const providerMap = new Map<string, number>();
  for (const s of sessions) {
    platformMap.set(
      s.clientPlatform,
      (platformMap.get(s.clientPlatform) ?? 0) + 1,
    );
    providerMap.set(s.provider, (providerMap.get(s.provider) ?? 0) + 1);
  }

  const totalSeconds = usages.reduce((acc, u) => acc + u.secondsDelta, 0);
  const errors = usages.filter((u) => u.eventType === "error").length;

  return {
    enabled: config.enabled,
    provider: config.provider,
    configuredProvider: config.configuredProvider,
    apiKeyPresent: config.apiKeyPresent,
    webEnabled: config.webEnabled,
    mobileEnabled: config.mobileEnabled,
    androidAutoEnabled: config.androidAutoEnabled,
    carplayEnabled: config.carplayEnabled,
    maxSessionSeconds: config.maxSessionSeconds,
    maxMonthlySeconds: config.maxMonthlySeconds,
    totals: {
      sessions: sessions.length,
      usageEvents: usages.length,
      totalSeconds,
      errors,
      activeSessions,
    },
    byDay: [...dayMap.entries()]
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    byPlatform: [...platformMap.entries()].map(([platform, count]) => ({
      platform,
      count,
    })),
    byProvider: [...providerMap.entries()].map(([provider, count]) => ({
      provider,
      count,
    })),
  };
}
