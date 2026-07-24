import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { EditorialToc } from "@/features/marketing/components/editorial-toc";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";
import { GUIDES_HUB } from "@/features/marketing/lib/guides-hub-content";
import {
  formatGuideDate,
  getGuideBySlug,
  getPublishedGuides,
  getRelatedGuides,
} from "@/features/marketing/lib/guides-registry";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";
import {
  WEEKEND_DAY_EXAMPLE,
  WEEKEND_GUIDE,
} from "@/features/marketing/lib/weekend-road-trip-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 4F — registre et hub", () => {
  it("publie exactement six guides, escapade en premier", () => {
    const guides = getPublishedGuides();
    expect(guides).toHaveLength(6);
    expect(guides.map((g) => g.slug)).toEqual([
      "escapade-fin-de-semaine-quebec",
      "road-trip-solo-quebec",
      "road-trip-couple-quebec",
      "road-trip-famille-quebec",
      "budget-road-trip-quebec",
      "checklist-road-trip-quebec",
    ]);
    expect(guides[0]?.categoryLabel).toBe("Court séjour");
    expect(formatGuideDate(guides[0]!.publishedAt)).toBe("24 juillet 2026");
    for (const guide of guides) {
      expect(guide.publishedAt <= "2026-07-24").toBe(true);
      expect(guide.updatedAt <= "2026-07-24").toBe(true);
    }
  });

  it("lie l’escapade et utilise un hero durable", () => {
    const weekend = getGuideBySlug("escapade-fin-de-semaine-quebec")!;
    expect(getRelatedGuides(weekend).map((g) => g.slug)).toEqual([
      "checklist-road-trip-quebec",
      "budget-road-trip-quebec",
      "road-trip-solo-quebec",
    ]);
    expect(GUIDES_HUB.hero.primaryCta.href).toBe("/guides#guides-publies");
    expect(GUIDES_HUB.hero.secondaryCta.href).toBe(
      "/guides/checklist-road-trip-quebec",
    );
    const hubPage = readSource("src/app/guides/page.tsx");
    expect(hubPage).toContain('id="guides-publies"');
  });
});

describe("lot SEO 4F — sitemap et métadonnées", () => {
  it("inclut l’escapade et conserve les six guides", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(
      "https://sebavia.com/guides/escapade-fin-de-semaine-quebec",
    );
    expect(urls).toContain("https://sebavia.com/guides/road-trip-solo-quebec");
    expect(urls).toContain("https://sebavia.com/guides");
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

  it("configure SEO du guide escapade", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides/escapade-fin-de-semaine-quebec",
      title: WEEKEND_GUIDE.meta.title,
      description: WEEKEND_GUIDE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/guides/escapade-fin-de-semaine-quebec",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(WEEKEND_GUIDE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(WEEKEND_GUIDE.meta.description.length).toBeLessThanOrEqual(170);
    expect(WEEKEND_GUIDE.hero.title).toMatch(/escapade/i);
    expect(WEEKEND_GUIDE.hero.title).toMatch(/fin de semaine/i);
    expect(WEEKEND_GUIDE.hero.title).toMatch(/Québec/);
  });
});

describe("lot SEO 4F — contenu et garde-fous", () => {
  it("page serveur avec Article, sans HowTo ni auteur fictif", () => {
    const page = readSource(
      "src/app/guides/escapade-fin-de-semaine-quebec/page.tsx",
    );
    expect(page).toContain("Article");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("articleSection");
    expect(page).not.toContain("HowTo");
    expect(page).not.toContain('"@type": "Person"');
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/\/api\/v1\//);
  });

  it("exemple fictif et formulations prudentes", () => {
    expect(WEEKEND_DAY_EXAMPLE.disclaimer).toMatch(/fictif/i);
    expect(WEEKEND_DAY_EXAMPLE.disclaimer).toMatch(/Aucun lieu/i);
    const content = readSource(
      "src/features/marketing/lib/weekend-road-trip-content.ts",
    );
    expect(content).toMatch(/cette fin de semaine/i);
    expect(content).toMatch(/week-end/i);
    expect(content).toMatch(/Magasinage/);
    expect(content).toMatch(/Aucune réservation directe/i);
    expect(content).toMatch(/ne garantit/i);
    expect(content).not.toMatch(/conduisez (?:au plus|maximum) \d+/i);
    expect(content).not.toMatch(/\bSebavio\b/);
    expect(content).not.toMatch(/\b(Get started|weekend getaway tips)\b/);
    expect(WEEKEND_GUIDE.finalCta.primary.href).toBe("/register");
    expect(WEEKEND_GUIDE.toc.map((t) => t.id)).toEqual(
      Array.from(new Set(WEEKEND_GUIDE.toc.map((t) => t.id))),
    );
  });

  it("TOC sans double numérotation", () => {
    const html = renderToStaticMarkup(
      createElement(EditorialToc, { items: WEEKEND_GUIDE.toc }),
    );
    expect(html).toContain("list-decimal");
    expect(html).not.toMatch(/1\.\s*1\s*\./);
    expect(html).toContain("Ne pas surcharger l’horaire");
  });

  it("maillage entrant", () => {
    const weekendUseCase = ROAD_TRIP_PAGE.useCases.find(
      (u) => u.title === "Escapade de fin de semaine",
    );
    expect(weekendUseCase && "guideLink" in weekendUseCase).toBe(true);
    if (weekendUseCase && "guideLink" in weekendUseCase) {
      expect(weekendUseCase.guideLink.href).toBe(
        "/guides/escapade-fin-de-semaine-quebec",
      );
    }
    const featuresWeekend = FEATURES_PAGE.useCases.find(
      (u) => u.id === "weekend",
    );
    expect(featuresWeekend && "guideLink" in featuresWeekend).toBe(true);
    const assistantWeekend = ASSISTANT_PAGE.useCases.find(
      (u) => u.title === "Escapade de fin de semaine",
    );
    expect(assistantWeekend && "guideLink" in assistantWeekend).toBe(true);
    const faq = readSource("src/app/faq/page.tsx");
    expect(faq).toContain("/guides/escapade-fin-de-semaine-quebec");
  });
});
