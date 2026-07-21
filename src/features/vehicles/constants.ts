/** Constantes module véhicules utilisateurs (Doc 4 / Doc 6). */

export const USER_DOCUMENT_TYPES = [
  "Assurance",
  "Immatriculation",
  "Facture",
  "Autre",
] as const;

/** Libellés d’affichage (y compris anciennes valeurs anglaises en base). */
export const USER_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  Assurance: "Assurance",
  Immatriculation: "Immatriculation",
  Facture: "Facture",
  Autre: "Autre",
  Insurance: "Assurance",
  Registration: "Immatriculation",
  Invoice: "Facture",
  Other: "Autre",
};

export const TOLL_PREFERENCES = ["avoid", "allow", "prefer"] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** VIN ISO 3779 : 17 caractères, sans I/O/Q. */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
