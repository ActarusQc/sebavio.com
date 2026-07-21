/** Parse FormData JSON profil voyageurs (serveur + client). */

export type TravelerProfileFormPayload = {
  deferred: boolean;
  purpose?: string;
  adultCount?: number;
  childCount?: number;
  childAges?: number[];
  interests?: string[];
  budgetPreference?: string | null;
  durationPreference?: string | null;
  maxDetourMinutes?: number;
  environmentPreference?: string | null;
  activityLevel?: string | null;
  accessibilityNeeds?: string[];
  travelingWithPet?: boolean;
};

export function parseTravelerJson(
  raw: string | null | undefined,
): TravelerProfileFormPayload | { deferred: true } | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as TravelerProfileFormPayload;
    if (parsed.deferred) return { deferred: true };
    return parsed;
  } catch {
    return null;
  }
}
