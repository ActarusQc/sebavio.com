/** Défauts profil / préférences (Doc 4 §2 — devise selon le pays). */

export const DEFAULT_LANGUAGE = "fr";
export const DEFAULT_COUNTRY = "CA";
export const DEFAULT_CURRENCY = "CAD";
export const DEFAULT_TIMEZONE = "America/Toronto";

export const DEFAULT_DISTANCE_UNIT = "km";
export const DEFAULT_TEMPERATURE_UNIT = "C";
export const DEFAULT_FUEL_UNIT = "L/100";

const COUNTRY_CURRENCY: Record<string, string> = {
  CA: "CAD",
  US: "USD",
  FR: "EUR",
  BE: "EUR",
  CH: "CHF",
  GB: "GBP",
  AU: "AUD",
  MX: "MXN",
};

export function currencyForCountry(country: string): string {
  const code = country.trim().toUpperCase();
  return COUNTRY_CURRENCY[code] ?? DEFAULT_CURRENCY;
}

export function defaultProfileData(userId: string) {
  return {
    userId,
    firstName: "",
    lastName: "",
    language: DEFAULT_LANGUAGE,
    country: DEFAULT_COUNTRY,
    currency: DEFAULT_CURRENCY,
    timezone: DEFAULT_TIMEZONE,
    travelStyle: null as string | null,
    budgetLevel: null as string | null,
  };
}

export function defaultPreferencesData(userId: string) {
  return {
    userId,
    distanceUnit: DEFAULT_DISTANCE_UNIT,
    temperatureUnit: DEFAULT_TEMPERATURE_UNIT,
    fuelUnit: DEFAULT_FUEL_UNIT,
    notificationsEnabled: true,
    aiProactive: false,
    costcoMember: false,
  };
}
