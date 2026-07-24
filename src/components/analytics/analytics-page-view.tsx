"use client";

import { useEffect } from "react";
import {
  safePathFromLocation,
  trackEvent,
  type SeoAnalyticsEventName,
} from "@/lib/analytics";

type AnalyticsPageViewProps = {
  eventName: SeoAnalyticsEventName;
  path: string;
  pageType?: string;
};

/**
 * Envoie un événement de vue une seule fois au montage.
 * N’embarque aucun script tiers.
 */
export function AnalyticsPageView({
  eventName,
  path,
  pageType,
}: AnalyticsPageViewProps) {
  useEffect(() => {
    trackEvent(eventName, {
      path: safePathFromLocation(path),
      page_type: pageType,
      surface: "marketing",
    });
  }, [eventName, path, pageType]);

  return null;
}
