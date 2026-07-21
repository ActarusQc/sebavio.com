type CounterMap = Record<string, number>;

const counters: CounterMap = {};

export function weatherMetricInc(
  name:
    | "cache_hit"
    | "cache_miss"
    | "provider_call"
    | "provider_error"
    | "quota_blocked"
    | "stale_fallback"
    | "coalesced",
  by = 1,
): void {
  counters[name] = (counters[name] ?? 0) + by;
}

export function getWeatherMetrics(): Readonly<CounterMap> {
  return { ...counters };
}

export function resetWeatherMetricsForTests(): void {
  for (const key of Object.keys(counters)) {
    delete counters[key];
  }
}

export function logWeatherEvent(
  event: string,
  meta: Record<string, unknown> = {},
): void {
  const safe = { ...meta };
  delete safe.apiKey;
  delete safe.appid;
  delete safe.Authorization;
  console.info(
    JSON.stringify({
      scope: "weather",
      event,
      ts: new Date().toISOString(),
      ...safe,
    }),
  );
}
