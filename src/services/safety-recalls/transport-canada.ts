import { z } from "zod";
import { AppError } from "@/lib/errors";
import { normalizeTransportCanadaItem } from "./normalize";
import {
  transportCanadaItemSchema,
  type NormalizedSafetyRecall,
  type RecallSearchInput,
} from "./types";

const listSchema = z.union([
  z.array(z.unknown()),
  z.object({
    results: z.array(z.unknown()).optional(),
    ResultSet: z.array(z.unknown()).optional(),
    data: z.array(z.unknown()).optional(),
  }),
]);

/**
 * Recherche des rappels Transport Canada (année / marque / modèle).
 * Si l’API n’est pas configurée ou échoue → liste vide + flag (pas de fausse donnée).
 */
export async function fetchTransportCanadaRecalls(
  input: RecallSearchInput,
): Promise<{
  recalls: NormalizedSafetyRecall[];
  unavailable: boolean;
  errorMessage?: string;
}> {
  const base = process.env.TRANSPORT_CANADA_RECALLS_BASE_URL?.trim();
  if (!base) {
    return {
      recalls: [],
      unavailable: true,
      errorMessage:
        "TRANSPORT_CANADA_RECALLS_BASE_URL non configuré — synchronisation des rappels désactivée.",
    };
  }

  const timeoutMs =
    Number(process.env.TRANSPORT_CANADA_RECALLS_TIMEOUT_MS ?? 15000) || 15000;

  const url = new URL(base);
  if (input.year) url.searchParams.set("year", String(input.year));
  if (input.make) url.searchParams.set("make", input.make);
  if (input.model) url.searchParams.set("model", input.model);
  if (input.vin) url.searchParams.set("vin", input.vin);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        recalls: [],
        unavailable: true,
        errorMessage: `Transport Canada indisponible (HTTP ${res.status}).`,
      };
    }

    const json: unknown = await res.json();
    const parsed = listSchema.safeParse(json);
    if (!parsed.success) {
      return {
        recalls: [],
        unavailable: true,
        errorMessage: "Réponse Transport Canada invalide.",
      };
    }

    const rawItems = Array.isArray(parsed.data)
      ? parsed.data
      : (parsed.data.results ??
        parsed.data.ResultSet ??
        parsed.data.data ??
        []);

    const recalls: NormalizedSafetyRecall[] = [];
    for (const item of rawItems.slice(0, 200)) {
      const row = transportCanadaItemSchema.safeParse(item);
      if (!row.success) continue;
      const normalized = normalizeTransportCanadaItem(row.data);
      if (normalized) recalls.push(normalized);
    }

    return { recalls, unavailable: false };
  } catch (error) {
    if (error instanceof AppError) throw error;
    return {
      recalls: [],
      unavailable: true,
      errorMessage: "Transport Canada temporairement indisponible.",
    };
  } finally {
    clearTimeout(timer);
  }
}
