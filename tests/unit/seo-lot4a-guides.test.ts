import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { CHECKLIST_GUIDE } from "@/features/marketing/lib/checklist-road-trip-content";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";
import { GUIDES_HUB } from "@/features/marketing/lib/guides-hub-content";
import {
  getGuideBySlug,
  getPublishedGuides,
  GUIDES,
} from "@/features/marketing/lib/guides-registry";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 4A — registre et hub", () => {
  it("n’expose que les guides publiés", () => {
    expect(GUIDES.length).toBeGreaterThanOrEqual(1);
    expect(getPublishedGuides().every((g) => g.isPublished)).toBe(true);
    expect(getGuideBySlug("checklist-road-trip-quebec")?.isPublished).toBe(
      true,
    );
    expect(getGuideBySlug("brouillon-inexistant")).toBeUndefined();
  });

  it("fige les dates de publication (pas de Date.now)", () => {
    const registry = readSource(
      "src/features/marketing/lib/guides-registry.ts",
    );
    expect(registry).not.toMatch(/Date\.now|new Date\(\)/);
    expect(GUIDES.every((g) => /^\d{4}-\d{2}-\d{2}$/.test(g.publishedAt))).toBe(
      true,
    );
    expect(GUIDES.every((g) => /^\d{4}-\d{2}-\d{2}$/.test(g.updatedAt))).toBe(
      true,
    );
  });
});

describe("lot SEO 4A — sitemap", () => {
  it("inclut /guides et la checklist", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://sebavia.com/guides");
    expect(urls).toContain(
      "https://sebavia.com/guides/checklist-road-trip-quebec",
    );
  });

  it("utilise une date lastModified figée", () => {
    const dates = sitemap().map((e) =>
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : String(e.lastModified),
    );
    expect(new Set(dates).size).toBe(1);
    expect(dates[0]).toBe("2026-07-24T12:00:00.000Z");
  });
});

describe("lot SEO 4A — métadonnées", () => {
  it("configure le hub /guides", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides",
      title: GUIDES_HUB.meta.title,
      description: GUIDES_HUB.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe("https://sebavia.com/guides");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(GUIDES_HUB.meta.description.length).toBeGreaterThanOrEqual(110);
    expect(GUIDES_HUB.meta.description.length).toBeLessThanOrEqual(170);
  });

  it("configure la checklist", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides/checklist-road-trip-quebec",
      title: CHECKLIST_GUIDE.meta.title,
      description: CHECKLIST_GUIDE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/guides/checklist-road-trip-quebec",
    );
    expect(CHECKLIST_GUIDE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(CHECKLIST_GUIDE.meta.description.length).toBeLessThanOrEqual(170);
  });
});

describe("lot SEO 4A — pages et contenu", () => {
  it("pages serveur avec JSON-LD adapté", () => {
    const hub = readSource("src/app/guides/page.tsx");
    expect(hub).toContain("CollectionPage");
    expect(hub).toContain("BreadcrumbList");
    expect(hub).toContain("GUIDES_HUB.hero");
    expect(hub).not.toMatch(/"use client"/);
    expect(hub).not.toMatch(/bientôt disponible|coming soon/i);
    expect(GUIDES_HUB.hero.title).toBe(
      "Guides pour préparer vos voyages routiers",
    );

    const guide = readSource(
      "src/app/guides/checklist-road-trip-quebec/page.tsx",
    );
    expect(guide).toContain("Article");
    expect(guide).toContain("BreadcrumbList");
    expect(guide).toContain("WebPage");
    expect(guide).not.toContain("HowTo");
    expect(guide).not.toMatch(/"use client"/);
    expect(guide).not.toMatch(/@sebavio\.com/);
  });

  it("checklist informative sans cannibaliser le planificateur", () => {
    expect(CHECKLIST_GUIDE.sections.length).toBeGreaterThanOrEqual(6);
    expect(CHECKLIST_GUIDE.toc.length).toBeGreaterThanOrEqual(8);
    const content = readSource(
      "src/features/marketing/lib/checklist-road-trip-content.ts",
    );
    expect(content).toContain("/planificateur-road-trip-quebec");
    expect(content).toContain("/calculateur-cout-carburant-voyage");
    expect(content).toContain("/planifier-arrets-carburant");
    expect(content).toContain("/meteo-voyage");
    expect(content).toContain("/assistant-voyage-ia");
    expect(content).toMatch(/ne remplace pas|ne couvrent pas|limites/i);
    expect(content).not.toMatch(/\bSebavio\b/);
    expect(content).not.toMatch(/\b(Get started|Sign up|best road trip app)\b/);
    expect(content).toMatch(/ne remplace pas.*diagnostic mécanique/i);
  });

  it("styles d’impression présents", () => {
    const css = readSource("src/app/globals.css");
    expect(css).toContain("@media print");
    expect(css).toContain("guide-no-print");
    expect(css).toContain("guide-check-box");
  });

  it("maillage depuis les pages existantes et le pied de page", () => {
    expect(ROAD_TRIP_PAGE.checklist.guideLink.href).toBe(
      "/guides/checklist-road-trip-quebec",
    );
    expect(FEATURES_PAGE.itinerary.guidesLink.href).toBe(
      "/guides/checklist-road-trip-quebec",
    );
    const footer = readSource(
      "src/features/marketing/components/site-footer.tsx",
    );
    expect(footer).toContain('href: "/guides"');
    const faq = readSource("src/app/faq/page.tsx");
    expect(faq).toContain("/guides/checklist-road-trip-quebec");
    expect(faq).toContain('href="/guides"');
  });

  it("un seul H1 par page (hero institutionnel)", () => {
    const hero = readSource(
      "src/features/marketing/components/institutional-hero.tsx",
    );
    expect((hero.match(/<h1\b/g) || []).length).toBe(1);
  });
});
