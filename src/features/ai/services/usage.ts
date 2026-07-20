import "server-only";

import { prisma } from "@/lib/prisma";

export type RecordAiUsageInput = {
  userId: string;
  tripId?: string | null;
  requestType: string;
  model?: string | null;
  promptVersion?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  durationMs: number;
  success: boolean;
  errorCode?: string | null;
  planSlug?: string | null;
};

export async function recordAiUsage(input: RecordAiUsageInput): Promise<void> {
  try {
    await prisma.aiUsage.create({
      data: {
        userId: input.userId,
        tripId: input.tripId ?? null,
        requestType: input.requestType,
        model: input.model ?? null,
        promptVersion: input.promptVersion ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        totalTokens: input.totalTokens ?? null,
        durationMs: input.durationMs,
        success: input.success,
        errorCode: input.errorCode ?? null,
        planSlug: input.planSlug ?? null,
      },
    });
  } catch {
    console.error("[ai] failed to record usage", {
      requestType: input.requestType,
      success: input.success,
      errorCode: input.errorCode,
    });
  }
}

export type AiAdminMetrics = {
  enabled: boolean;
  modelConfigured: string;
  apiKeyPresent: boolean;
  totals: {
    requests: number;
    successes: number;
    errors: number;
    avgDurationMs: number | null;
  };
  byDay: Array<{ day: string; count: number; successes: number }>;
  byRequestType: Array<{ requestType: string; count: number }>;
  byPlanSlug: Array<{ planSlug: string; count: number }>;
  byPromptVersion: Array<{ promptVersion: string; count: number }>;
};

export async function getAiAdminMetrics(
  days = 30,
): Promise<
  Omit<AiAdminMetrics, "enabled" | "modelConfigured" | "apiKeyPresent">
> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const rows = await prisma.aiUsage.findMany({
    where: { createdAt: { gte: since } },
    select: {
      requestType: true,
      success: true,
      durationMs: true,
      planSlug: true,
      promptVersion: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totals = {
    requests: rows.length,
    successes: rows.filter((r) => r.success).length,
    errors: rows.filter((r) => !r.success).length,
    avgDurationMs:
      rows.length === 0
        ? null
        : Math.round(
            rows.reduce((sum, r) => sum + r.durationMs, 0) / rows.length,
          ),
  };

  const dayMap = new Map<string, { count: number; successes: number }>();
  const typeMap = new Map<string, number>();
  const planMap = new Map<string, number>();
  const promptMap = new Map<string, number>();

  for (const row of rows) {
    const day = row.createdAt.toISOString().slice(0, 10);
    const dayEntry = dayMap.get(day) ?? { count: 0, successes: 0 };
    dayEntry.count += 1;
    if (row.success) dayEntry.successes += 1;
    dayMap.set(day, dayEntry);

    typeMap.set(row.requestType, (typeMap.get(row.requestType) ?? 0) + 1);
    const plan = row.planSlug ?? "inconnu";
    planMap.set(plan, (planMap.get(plan) ?? 0) + 1);
    const prompt = row.promptVersion ?? "inconnu";
    promptMap.set(prompt, (promptMap.get(prompt) ?? 0) + 1);
  }

  return {
    totals,
    byDay: [...dayMap.entries()].map(([day, v]) => ({ day, ...v })),
    byRequestType: [...typeMap.entries()].map(([requestType, count]) => ({
      requestType,
      count,
    })),
    byPlanSlug: [...planMap.entries()].map(([planSlug, count]) => ({
      planSlug,
      count,
    })),
    byPromptVersion: [...promptMap.entries()].map(([promptVersion, count]) => ({
      promptVersion,
      count,
    })),
  };
}
