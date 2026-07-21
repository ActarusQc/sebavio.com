/**
 * Déduplication des appels simultanés identiques (in-flight).
 */
const inflight = new Map<string, Promise<unknown>>();

export async function coalesceAsync<T>(
  key: string,
  factory: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const promise = factory().finally(() => {
    if (inflight.get(key) === promise) {
      inflight.delete(key);
    }
  });
  inflight.set(key, promise);
  return promise;
}

export function clearCoalesceForTests(): void {
  inflight.clear();
}
