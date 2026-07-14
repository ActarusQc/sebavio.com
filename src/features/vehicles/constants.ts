/** Constantes module véhicules utilisateurs (Doc 4 / Doc 6). */

export const USER_DOCUMENT_TYPES = [
  "Insurance",
  "Registration",
  "Invoice",
  "Other",
] as const;

export const TOLL_PREFERENCES = ["avoid", "allow", "prefer"] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** VIN ISO 3779 : 17 caractères, sans I/O/Q. */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
