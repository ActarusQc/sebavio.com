/**
 * Compteurs en mémoire pour observabilité FDE (pas de secret).
 */

export type FdeMetricCounters = {
  calls: number;
  success: number;
  errors: number;
  timeouts: number;
  unauthorized: number;
  forbidden: number;
  rateLimited: number;
  serverErrors: number;
  invalidResponses: number;
  cacheHits: number;
  cacheMisses: number;
  nearbyStationsTotal: number;
  regionalFallbacks: number;
  estimatesOk: number;
  estimatesFailed: number;
};

const counters: FdeMetricCounters = {
  calls: 0,
  success: 0,
  errors: 0,
  timeouts: 0,
  unauthorized: 0,
  forbidden: 0,
  rateLimited: 0,
  serverErrors: 0,
  invalidResponses: 0,
  cacheHits: 0,
  cacheMisses: 0,
  nearbyStationsTotal: 0,
  regionalFallbacks: 0,
  estimatesOk: 0,
  estimatesFailed: 0,
};

export function fdeMetricInc(key: keyof FdeMetricCounters, by = 1): void {
  counters[key] += by;
}

export function getFdeMetrics(): Readonly<FdeMetricCounters> {
  return { ...counters };
}

export function resetFdeMetrics(): void {
  for (const key of Object.keys(counters) as Array<keyof FdeMetricCounters>) {
    counters[key] = 0;
  }
}

/** Log structuré sans coordonnées précises ni secrets. */
export function logFdeEvent(
  event: string,
  fields: Record<string, string | number | boolean | undefined | null>,
): void {
  const safe: Record<string, string | number | boolean> = { event };
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    if (/key|secret|authorization|token|password/i.test(k)) continue;
    safe[k] = v;
  }
  console.info("[fde]", JSON.stringify(safe));
}
