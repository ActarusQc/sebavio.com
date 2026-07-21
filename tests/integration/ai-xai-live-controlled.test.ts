/**
 * Validation contrôlée xAI — max 3 appels réels.
 * Aucune action d’écriture. Ne log jamais la clé API.
 *
 * Usage :
 *   npx vitest run tests/integration/ai-xai-live-controlled.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";
import { runTripAssistant } from "@/features/ai/services/trip-assistant";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";
import { getAiRuntimeConfig } from "@/services/ai/config";

const GASPE_TRIP_ID =
  process.env.E2E_GASPE_TRIP_ID ?? "915d87de-2cc5-4c9d-b20f-2e4524bca537";

type CallReport = {
  name: string;
  requestType: string;
  ok: boolean;
  code: string | null;
  mode: string | null;
  model: string | null;
  zodOk: boolean;
  frenchOk: boolean;
  hasProposedAction: boolean;
  answerPreview: string | null;
  durationMs: number;
  usage: {
    provider: string | null;
    model: string | null;
    success: boolean;
    errorCode: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  } | null;
};

const report: {
  startedAt: string;
  provider: string;
  enabled: boolean;
  modelConfigured: string;
  apiKeyPresent: boolean;
  calls: CallReport[];
  noWriteMutation?: boolean;
  stopCountBefore?: number;
  stopCountAfter?: number;
} = {
  startedAt: new Date().toISOString(),
  provider: "",
  enabled: false,
  modelConfigured: "",
  apiKeyPresent: false,
  calls: [],
};

describe("Validation contrôlée xAI (3 appels max)", () => {
  let userId = "";
  let tripId = "";
  let stopCountBefore = 0;

  beforeAll(async () => {
    const config = getAiRuntimeConfig();
    report.provider = config.provider;
    report.enabled = config.enabled;
    report.modelConfigured = config.model;
    report.apiKeyPresent = config.apiKeyPresent;

    expect(config.provider).toBe("xai");
    expect(config.enabled).toBe(true);
    expect(config.apiKeyPresent).toBe(true);
    expect(config.model).toBeTruthy();

    const trip = await prisma.trip.findFirst({
      where: { id: GASPE_TRIP_ID, deletedAt: null },
      select: { id: true, userId: true },
    });
    expect(trip).toBeTruthy();
    userId = trip!.userId;
    tripId = trip!.id;
    stopCountBefore = await prisma.tripStop.count({
      where: { tripId },
    });
    report.stopCountBefore = stopCountBefore;
  }, 60_000);

  afterAll(async () => {
    const stopCountAfter = await prisma.tripStop.count({
      where: { tripId },
    });
    report.stopCountAfter = stopCountAfter;
    report.noWriteMutation = stopCountBefore === stopCountAfter;
    writeFileSync(
      "/tmp/xai-controlled-validation-report.json",
      JSON.stringify(report, null, 2),
    );
    console.log(
      "\n[xAI VALIDATION REPORT]",
      JSON.stringify({
        calls: report.calls.length,
        allOk: report.calls.every((c) => c.ok && c.zodOk),
        noWriteMutation: report.noWriteMutation,
        path: "/tmp/xai-controlled-validation-report.json",
      }),
    );
    await prisma.$disconnect();
  }, 60_000);

  async function runCall(params: {
    name: string;
    requestType: string;
    message: string;
  }): Promise<void> {
    const started = Date.now();
    const result = await runTripAssistant({
      userId,
      raw: {
        tripId,
        message: params.message,
        requestType: params.requestType,
      },
    });
    const durationMs = Date.now() - started;

    let zodOk = false;
    let frenchOk = false;
    let answerPreview: string | null = null;
    let hasProposedAction = false;

    if (result.ok) {
      zodOk = tripAssistantResponseSchema.safeParse(result.response).success;
      const answer = result.response.answer ?? "";
      frenchOk =
        /[àâäéèêëïîôùûüç]/i.test(answer) ||
        /\b(le|la|les|des|une|votre|trajet|voyage|pause|carburant)\b/i.test(
          answer,
        );
      answerPreview = answer.slice(0, 200);
      hasProposedAction = (result.response.suggestions ?? []).some(
        (s) => s.proposedAction != null,
      );
    }

    const usage = await prisma.aiUsage.findFirst({
      where: { userId, tripId, requestType: params.requestType },
      orderBy: { createdAt: "desc" },
      select: {
        provider: true,
        model: true,
        success: true,
        errorCode: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
      },
    });

    const entry: CallReport = {
      name: params.name,
      requestType: params.requestType,
      ok: result.ok,
      code: result.ok ? null : result.code,
      mode: result.ok ? result.mode : null,
      model: result.ok ? result.model : null,
      zodOk,
      frenchOk,
      hasProposedAction,
      answerPreview,
      durationMs,
      usage,
    };
    report.calls.push(entry);

    console.log(
      JSON.stringify({
        call: params.name,
        ok: result.ok,
        code: result.ok ? undefined : result.code,
        mode: result.ok ? result.mode : undefined,
        model: result.ok ? result.model : undefined,
        zodOk,
        frenchOk,
        provider: usage?.provider,
        tokens: usage?.totalTokens,
        durationMs,
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("personalized");
      expect(zodOk).toBe(true);
      expect(frenchOk).toBe(true);
      expect(usage?.provider).toBe("xai");
      expect(usage?.model).toBeTruthy();
      expect(usage?.success).toBe(true);
    }
  }

  it("1) analyse générale du voyage Gaspé", async () => {
    await runCall({
      name: "analyze_gaspe",
      requestType: "analyze",
      message: "Analyse mon voyage de façon structurée, en français.",
    });
  }, 180_000);

  it("2) explication du carburant", async () => {
    await runCall({
      name: "fuel_explanation",
      requestType: "fuel",
      message:
        "Explique-moi l'estimation de carburant de ce voyage, sans inventer de stations.",
    });
  }, 180_000);

  it("3) suggestion de pause sans application", async () => {
    await runCall({
      name: "pause_suggestion_no_apply",
      requestType: "schedule",
      message:
        "Suggère une pause de conduite pertinente, sans l'appliquer. Ne propose que la suggestion.",
    });

    const stopCountAfter = await prisma.tripStop.count({
      where: { tripId },
    });
    expect(stopCountAfter).toBe(stopCountBefore);
  }, 180_000);
});
