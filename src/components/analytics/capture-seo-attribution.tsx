"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "sebavia_attribution_v1";

type AttributionSnapshot = {
  landing_path: string;
  referrer_host?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  channel: "organic_search" | "direct" | "referral" | "other";
  first_visit_date: string;
};

function hostFromReferrer(referrer: string): string | undefined {
  try {
    if (!referrer) return undefined;
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function classifyChannel(
  referrerHost: string | undefined,
  utmMedium: string | undefined,
): AttributionSnapshot["channel"] {
  const medium = (utmMedium ?? "").toLowerCase();
  if (medium === "organic" || medium === "seo") return "organic_search";
  if (!referrerHost) return "direct";
  if (
    /(google|bing|yahoo|duckduckgo|ecosia|qwant)\./i.test(referrerHost) ||
    referrerHost === "google.com" ||
    referrerHost === "bing.com"
  ) {
    return "organic_search";
  }
  if (referrerHost.endsWith("sebavia.com")) return "direct";
  return "referral";
}

/**
 * Capture une attribution de première visite (chemins / hôtes / UTM seulement).
 * Aucune identité personnelle.
 */
export function CaptureSeoAttribution() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;

      const params = new URLSearchParams(window.location.search);
      const utm_source = params.get("utm_source")?.slice(0, 80) || undefined;
      const utm_medium = params.get("utm_medium")?.slice(0, 80) || undefined;
      const utm_campaign =
        params.get("utm_campaign")?.slice(0, 80) || undefined;
      const referrer_host = hostFromReferrer(document.referrer);
      const landing_path = window.location.pathname.split("?")[0] || "/";
      const channel = classifyChannel(referrer_host, utm_medium);
      const first_visit_date = new Date().toISOString().slice(0, 10);

      const snapshot: AttributionSnapshot = {
        landing_path,
        referrer_host,
        utm_source,
        utm_medium,
        utm_campaign,
        channel,
        first_visit_date,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));

      trackEvent("seo_landing_view", {
        path: landing_path,
        landing_path,
        referrer_host,
        utm_source,
        utm_medium,
        utm_campaign,
        channel,
        first_visit_date,
        page_type: "entry",
      });
    } catch {
      // ignore
    }
  }, []);

  return null;
}
