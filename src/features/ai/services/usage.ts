import "server-only";

import { prisma } from "@/lib/prisma";

export type RecordAiUsageInput = {
  userId: string;
  tripId?: string | null;
  requestType: string;
  provider?: string | null;
  model?: string | null;
  promptVersion?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  durationMs: number;
  success: boolean;
  errorCode?: string | null;
  planSlug?: string | null;
  knowledgeMode?: string | null;
  webSearchUsed?: boolean;
  webSearchCallCount?: number;
  intent?: string | null;
  sourceCount?: number | null;
};

export async function recordAiUsage(input: RecordAiUsageInput): Promise<void> {
  try {
    await prisma.aiUsage.create({
      data: {
        userId: input.userId,
        tripId: input.tripId ?? null,
        requestType: input.requestType,
        provider: input.provider ?? null,
        model: input.model ?? null,
        promptVersion: input.promptVersion ?? null,
        knowledgeMode: input.knowledgeMode ?? null,
        intent: input.intent ?? null,
        webSearchUsed: input.webSearchUsed ?? false,
        webSearchCallCount: input.webSearchCallCount ?? 0,
        sourceCount: input.sourceCount ?? null,
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
      provider: input.provider,
      webSearchUsed: input.webSearchUsed,
    });
  }
}

export type AiAdminMetrics = {
  enabled: boolean;
  provider: string;
  modelConfigured: string;
  apiKeyPresent: boolean;
  totals: {
    requests: number;
    successes: number;
    errors: number;
    avgDurationMs: number | null;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    webSearches: number;
    webSearchSuccesses: number;
    avgSourceCount: number | null;
    restaurantRequests: number;
    restaurantClarifications: number;
    restaurantWithResults: number;
    restaurantWithoutResults: number;
    restaurantAvgDurationMs: number | null;
  };
  byDay: Array<{ day: string; count: number; successes: number }>;
  byRequestType: Array<{ requestType: string; count: number }>;
  byIntent: Array<{ intent: string; count: number }>;
  byPlanSlug: Array<{ planSlug: string; count: number }>;
  byPromptVersion: Array<{ promptVersion: string; count: number }>;
};

export async function getAiAdminMetrics(
  days = 30,
): Promise<
  Omit<
    AiAdminMetrics,
    "enabled" | "provider" | "modelConfigured" | "apiKeyPresent"
  >
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
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      webSearchUsed: true,
      sourceCount: true,
      intent: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const webRows = rows.filter((r) => r.webSearchUsed);
  const sourceCounts = webRows
    .map((r) => r.sourceCount)
    .filter((n): n is number => typeof n === "number");

  const restaurantRows = rows.filter(
    (r) =>
      r.intent === "restaurant_recommendation" ||
      r.intent === "restaurant_search",
  );
  const clarificationRows = rows.filter(
    (r) => r.intent === "restaurant_clarification",
  );
  const restaurantWithResults = restaurantRows.filter(
    (r) => r.success && (r.sourceCount ?? 0) > 0,
  );
  const restaurantWithoutResults = restaurantRows.filter(
    (r) => r.success && (r.sourceCount ?? 0) === 0,
  );

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
    inputTokens: rows.reduce((sum, r) => sum + (r.inputTokens ?? 0), 0),
    outputTokens: rows.reduce((sum, r) => sum + (r.outputTokens ?? 0), 0),
    totalTokens: rows.reduce((sum, r) => sum + (r.totalTokens ?? 0), 0),
    webSearches: webRows.length,
    webSearchSuccesses: webRows.filter((r) => r.success).length,
    avgSourceCount:
      sourceCounts.length === 0
        ? null
        : Math.round(
            (sourceCounts.reduce((a, b) => a + b, 0) / sourceCounts.length) *
              10,
          ) / 10,
    restaurantRequests: restaurantRows.length,
    restaurantClarifications: clarificationRows.length,
    restaurantWithResults: restaurantWithResults.length,
    restaurantWithoutResults: restaurantWithoutResults.length,
    restaurantAvgDurationMs:
      restaurantRows.length === 0
        ? null
        : Math.round(
            restaurantRows.reduce((sum, r) => sum + r.durationMs, 0) /
              restaurantRows.length,
          ),
  };

  const dayMap = new Map<string, { count: number; successes: number }>();
  const typeMap = new Map<string, number>();
  const intentMap = new Map<string, number>();
  const planMap = new Map<string, number>();
  const promptMap = new Map<string, number>();

  for (const row of rows) {
    const day = row.createdAt.toISOString().slice(0, 10);
    const dayEntry = dayMap.get(day) ?? { count: 0, successes: 0 };
    dayEntry.count += 1;
    if (row.success) dayEntry.successes += 1;
    dayMap.set(day, dayEntry);

    typeMap.set(row.requestType, (typeMap.get(row.requestType) ?? 0) + 1);
    const intent = row.intent ?? "inconnu";
    intentMap.set(intent, (intentMap.get(intent) ?? 0) + 1);
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
    byIntent: [...intentMap.entries()].map(([intent, count]) => ({
      intent,
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
