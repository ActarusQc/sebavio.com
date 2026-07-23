import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Date figée : à mettre à jour uniquement quand le contenu public listé change réellement.
 * Lot SEO 3D : ajout de /calculateur-cout-carburant-voyage.
 */
const SITEMAP_LAST_MODIFIED = new Date("2026-07-23T21:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/fonctionnalites`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/assistant-voyage-ia`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/planificateur-road-trip-quebec`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/calculateur-cout-carburant-voyage`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/a-propos`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/confidentialite`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/conditions-utilisation`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
