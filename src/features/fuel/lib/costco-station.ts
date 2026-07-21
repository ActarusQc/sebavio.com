/**
 * Détecte une station Costco (accès réservé aux membres).
 * Utilisé pour exclure ces stations si l'utilisateur n'est pas membre.
 */
const COSTCO_RE = /\bcostco\b/i;

export function isCostcoStation(
  ...parts: Array<string | null | undefined>
): boolean {
  for (const part of parts) {
    if (part && COSTCO_RE.test(part)) return true;
  }
  return false;
}

/** Filtre les candidats / stations Costco hors plan. */
export function excludeCostcoStations<
  T extends {
    stationName?: string | null;
    label?: string | null;
    name?: string | null;
    brand?: string | null;
    stationBrand?: string | null;
  },
>(items: T[], includeCostco: boolean): T[] {
  if (includeCostco) return items;
  return items.filter(
    (item) =>
      !isCostcoStation(
        item.stationName,
        item.label,
        item.name,
        item.brand,
        item.stationBrand,
      ),
  );
}
