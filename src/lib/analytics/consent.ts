/**
 * Consentement analytique.
 * Sans CMP : si REQUIRE_CONSENT=true, aucun événement n’est envoyé
 * jusqu’à ce qu’un mécanisme de consentement soit branché.
 */
const CONSENT_STORAGE_KEY = "sebavia_analytics_consent";

export function analyticsRequiresConsent(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT === "true";
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  if (!analyticsRequiresConsent()) return true;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted";
  } catch {
    return false;
  }
}

/** À appeler uniquement depuis une CMP future après choix utilisateur. */
export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (granted) {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    } else {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}
