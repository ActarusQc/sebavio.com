import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { EditorialToc } from "@/features/marketing/components/editorial-toc";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import {
  COUPLE_DAY_EXAMPLE,
  COUPLE_GUIDE,
} from "@/features/marketing/lib/couple-road-trip-content";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";
import {
  formatGuideDate,
  getGuideBySlug,
  getPublishedGuides,
  getRelatedGuides,
} from "@/features/marketing/lib/guides-registry";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 4D — registre et hub", () => {
  it("publie exactement quatre guides, couple en premier", () => {
    const guides = getPublishedGuides();
    expect(guides).toHaveLength(4);
    expect(guides.map((g) => g.slug)).toEqual([
      "road-trip-couple-quebec",
      "road-trip-famille-quebec",
      "budget-road-trip-quebec",
      "checklist-road-trip-quebec",
    ]);
    expect(guides[0]?.categoryLabel).toBe("Couple");
    expect(formatGuideDate(guides[0]!.publishedAt)).toBe("24 juillet 2026");
    expect(formatGuideDate("2026-07-23")).toBe("23 juillet 2026");
  });

  it("lie le guide couple aux autres", () => {
    const couple = getGuideBySlug("road-trip-couple-quebec")!;
    expect(getRelatedGuides(couple).map((g) => g.slug)).toEqual([
      "checklist-road-trip-quebec",
      "budget-road-trip-quebec",
      "road-trip-famille-quebec",
    ]);
  });
});

describe("lot SEO 4D — sitemap et métadonnées", () => {
  it("inclut le guide couple", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(
      "https://sebavia.com/guides/road-trip-couple-quebec",
    );
    expect(urls).toContain("https://sebavia.com/guides");
    expect(urls).toContain(
      "https://sebavia.com/guides/road-trip-famille-quebec",
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

  it("configure SEO du guide couple", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides/road-trip-couple-quebec",
      title: COUPLE_GUIDE.meta.title,
      description: COUPLE_GUIDE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/guides/road-trip-couple-quebec",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(COUPLE_GUIDE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(COUPLE_GUIDE.meta.description.length).toBeLessThanOrEqual(170);
    expect(COUPLE_GUIDE.hero.title).toMatch(/road trip/i);
    expect(COUPLE_GUIDE.hero.title).toMatch(/couple/i);
    expect(COUPLE_GUIDE.hero.title).toMatch(/Québec/);
  });
});

describe("lot SEO 4D — contenu et garde-fous", () => {
  it("page serveur avec Article, sans HowTo ni auteur fictif", () => {
    const page = readSource("src/app/guides/road-trip-couple-quebec/page.tsx");
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
    expect(COUPLE_DAY_EXAMPLE.disclaimer).toMatch(/fictif/i);
    expect(COUPLE_DAY_EXAMPLE.disclaimer).toMatch(/Aucun lieu/i);
    const content = readSource(
      "src/features/marketing/lib/couple-road-trip-content.ts",
    );
    expect(content).not.toMatch(/conseil relationnel.*obligatoire/i);
    expect(content).toMatch(/n’est pas un conseil relationnel/i);
    expect(content).not.toMatch(/\bSebavio\b/);
    expect(content).not.toMatch(/\b(Get started|romantic getaway tips)\b/);
    expect(COUPLE_GUIDE.finalCta.primary.href).toBe("/register");
  });

  it("TOC sans double numérotation", () => {
    const html = renderToStaticMarkup(
      createElement(EditorialToc, { items: COUPLE_GUIDE.toc }),
    );
    expect(html).toContain("list-decimal");
    expect(html).not.toMatch(/1\.\s*1\s*\./);
    expect(html).toContain("Choisir le style de l’escapade");
  });

  it("maillage entrant", () => {
    expect(ROAD_TRIP_PAGE.group.coupleGuideLink.href).toBe(
      "/guides/road-trip-couple-quebec",
    );
    expect(FEATURES_PAGE.personalization.coupleGuideLink.href).toBe(
      "/guides/road-trip-couple-quebec",
    );
    const coupleUseCase = FEATURES_PAGE.useCases.find((u) => u.id === "couple");
    expect(coupleUseCase && "guideLink" in coupleUseCase).toBe(true);
    const weekend = ASSISTANT_PAGE.useCases.find(
      (u) => u.title === "Escapade de fin de semaine",
    );
    expect(weekend && "guideLink" in weekend).toBe(true);
    const faq = readSource("src/app/faq/page.tsx");
    expect(faq).toContain("/guides/road-trip-couple-quebec");
  });
});
