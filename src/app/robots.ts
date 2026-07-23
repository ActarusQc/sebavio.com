import type { MetadataRoute } from "next";
import { CANONICAL_SITE_ORIGIN, getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Zones privées / API seulement. Les pages auth restent crawlables
      // pour que Google lise leur balise noindex.
      disallow: ["/dashboard/", "/admin/", "/api/"],
    },
    sitemap: `${CANONICAL_SITE_ORIGIN}/sitemap.xml`,
    host: siteUrl,
  };
}
