/**
 * Résolution pure des entitlements à partir de lignes (sans Prisma).
 */

import {
  assertKnownEntitlementKey,
  type PlanEntitlementKey,
  type PlanEntitlementValue,
} from "@/features/plans/lib/entitlement-registry";

export type EntitlementRow = {
  key: string;
  enabled: boolean;
  limit: number | null;
  value: string | null;
};

function assertNonNegativeIntegerUsage(currentUsage: number): void {
  if (
    typeof currentUsage !== "number" ||
    !Number.isInteger(currentUsage) ||
    currentUsage < 0
  ) {
    throw new Error(
      "L'usage courant doit être un entier non négatif (pas de décimal ni de valeur négative).",
    );
  }
}

/**
 * Résout une entitlement connue depuis des lignes.
 * Absent → défaut sécurisé désactivé. Doublons / limite négative → erreur.
 * Les clés inconnues présentes dans `rows` sont ignorées.
 */
export function resolveEntitlementFromRows(
  rows: readonly EntitlementRow[],
  key: PlanEntitlementKey,
): PlanEntitlementValue {
  assertKnownEntitlementKey(key);

  const matches = rows.filter((row) => row.key === key);

  if (matches.length > 1) {
    throw new Error(
      `Plusieurs lignes (doublon) pour la clé d'entitlement : ${key}`,
    );
  }

  if (matches.length === 0) {
    return { key, enabled: false, limit: null, value: null };
  }

  const row = matches[0]!;

  if (row.limit !== null && row.limit < 0) {
    throw new Error(
      `Limite négative non autorisée pour l'entitlement : ${key}`,
    );
  }

  return {
    key,
    enabled: row.enabled,
    limit: row.limit,
    value: row.value,
  };
}

/**
 * Indique si l'usage courant est encore dans la limite.
 * - disabled → false
 * - limit null (et enabled) → illimité
 * - sinon → currentUsage < limit
 */
export function isWithinLimit(
  currentUsage: number,
  entitlement: PlanEntitlementValue,
): boolean {
  assertNonNegativeIntegerUsage(currentUsage);

  if (!entitlement.enabled) {
    return false;
  }

  if (entitlement.limit === null) {
    return true;
  }

  return currentUsage < entitlement.limit;
}

/**
 * Reste d'usage disponible.
 * - disabled → 0
 * - unlimited → null
 * - limited → max(0, limit - currentUsage)
 */
export function getRemainingUsage(
  currentUsage: number,
  entitlement: PlanEntitlementValue,
): number | null {
  assertNonNegativeIntegerUsage(currentUsage);

  if (!entitlement.enabled) {
    return 0;
  }

  if (entitlement.limit === null) {
    return null;
  }

  return Math.max(0, entitlement.limit - currentUsage);
}
