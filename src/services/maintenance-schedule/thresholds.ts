/** Seuils d’échéance entretien — configurables centralement. */

export const DUE_THRESHOLDS = {
  dueNowKm: 500,
  dueNowDays: 30,
  dueSoonKm: 2000,
  dueSoonDays: 90,
} as const;

export type DueThresholds = typeof DUE_THRESHOLDS;
