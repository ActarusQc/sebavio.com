/** Noms d’événements SEO / conversion (lot 5B). */
export const SEO_ANALYTICS_EVENTS = [
  "seo_landing_view",
  "pricing_view",
  "registration_started",
  "registration_completed",
  "trip_creation_started",
  "trip_created",
  "assistant_opened",
  "assistant_trip_action_confirmed",
  "plan_selected",
  "checkout_started",
  "subscription_activated",
] as const;

export type SeoAnalyticsEventName = (typeof SEO_ANALYTICS_EVENTS)[number];

/** Propriétés autorisées (liste blanche stricte). */
export type AnalyticsProperties = {
  path?: string;
  page_type?: string;
  channel?: "organic_search" | "direct" | "referral" | "other";
  landing_path?: string;
  referrer_host?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  plan_slug?: string;
  surface?: "form" | "assistant" | "pricing" | "marketing";
  first_visit_date?: string;
};

export type AnalyticsProviderName = "noop" | "console";

export type TrackEventInput = {
  name: SeoAnalyticsEventName;
  properties?: AnalyticsProperties;
};

export type AnalyticsAdapter = {
  name: AnalyticsProviderName;
  track: (input: TrackEventInput) => void | Promise<void>;
};
