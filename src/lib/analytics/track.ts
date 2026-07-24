import { consoleAdapter } from "./adapters/console";
import { noopAdapter } from "./adapters/noop";
import { hasAnalyticsConsent, analyticsRequiresConsent } from "./consent";
import { sanitizeAnalyticsProperties } from "./sanitize";
import type {
  AnalyticsAdapter,
  AnalyticsProviderName,
  AnalyticsProperties,
  SeoAnalyticsEventName,
  TrackEventInput,
} from "./types";

function resolveProviderName(): AnalyticsProviderName {
  const raw = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER?.trim().toLowerCase();
  if (raw === "console") return "console";
  return "noop";
}

function getAdapter(): AnalyticsAdapter {
  const name = resolveProviderName();
  if (name === "console") return consoleAdapter;
  return noopAdapter;
}

/**
 * Point d’entrée unique pour les événements SEO / conversion.
 * - Aucune requête externe sans fournisseur configuré.
 * - Aucun échec utilisateur si l’analytique est indisponible.
 * - Respecte le consentement lorsque REQUIRE_CONSENT=true.
 */
export function trackEvent(
  name: SeoAnalyticsEventName,
  properties?: AnalyticsProperties,
): void {
  try {
    if (analyticsRequiresConsent() && !hasAnalyticsConsent()) return;

    const adapter = getAdapter();
    if (adapter.name === "noop") return;

    const payload: TrackEventInput = {
      name,
      properties: sanitizeAnalyticsProperties(properties),
    };
    void Promise.resolve(adapter.track(payload)).catch(() => {
      // jamais bloquant
    });
  } catch {
    // jamais bloquant
  }
}

export function getConfiguredAnalyticsProvider(): AnalyticsProviderName {
  return resolveProviderName();
}

export function isAnalyticsEnabled(): boolean {
  return resolveProviderName() !== "noop";
}
