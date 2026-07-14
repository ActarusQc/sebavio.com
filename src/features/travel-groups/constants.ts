/** Constantes module groupes de voyage (Doc 4 §3 / Doc 6). */

/**
 * default_group — règles retenues (Partie 11bis) :
 * - Premier groupe créé → default_group=true automatiquement.
 * - Soft-delete du groupe par défaut → le plus ancien restant (created_at ASC)
 *   devient le défaut ; s'il n'en reste aucun, aucun défaut.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const RELATIONSHIP_OPTIONS = [
  "self",
  "spouse",
  "partner",
  "child",
  "parent",
  "friend",
  "other",
] as const;

export const MOBILITY_LEVELS = ["normal", "reduced", "wheelchair"] as const;

export const RELATIONSHIP_LABELS: Record<
  (typeof RELATIONSHIP_OPTIONS)[number],
  string
> = {
  self: "Moi",
  spouse: "Conjoint(e)",
  partner: "Partenaire",
  child: "Enfant",
  parent: "Parent",
  friend: "Ami(e)",
  other: "Autre",
};

export const MOBILITY_LABELS: Record<(typeof MOBILITY_LEVELS)[number], string> =
  {
    normal: "Normale",
    reduced: "Réduite",
    wheelchair: "Fauteuil roulant",
  };
