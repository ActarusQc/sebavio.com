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
  FAMILY_DAY_EXAMPLE,
  FAMILY_GUIDE,
} from "@/features/marketing/lib/family-road-trip-content";
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

describe("lot SEO 4C — registre et hub", () => {
  it("publie exactement trois guides, famille en premier", () => {
    const guides = getPublishedGuides();
    expect(guides).toHaveLength(3);
    expect(guides.map((g) => g.slug)).toEqual([
      "road-trip-famille-quebec",
      "budget-road-trip-quebec",
      "checklist-road-trip-quebec",
    ]);
    expect(guides[0]?.categoryLabel).toBe("Famille");
    expect(formatGuideDate(guides[0]!.publishedAt)).toBe("23 juillet 2026");
    expect(formatGuideDate("2026-07-23")).toBe("23 juillet 2026");
  });

  it("lie les guides entre eux", () => {
    const family = getGuideBySlug("road-trip-famille-quebec")!;
    expect(getRelatedGuides(family).map((g) => g.slug)).toEqual([
      "checklist-road-trip-quebec",
      "budget-road-trip-quebec",
    ]);
    expect(
      getRelatedGuides(getGuideBySlug("checklist-road-trip-quebec")!).map(
        (g) => g.slug,
      ),
    ).toContain("road-trip-famille-quebec");
    expect(
      getRelatedGuides(getGuideBySlug("budget-road-trip-quebec")!).map(
        (g) => g.slug,
      ),
    ).toContain("road-trip-famille-quebec");
  });
});

describe("lot SEO 4C — sitemap et métadonnées", () => {
  it("inclut le guide famille", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(
      "https://sebavia.com/guides/road-trip-famille-quebec",
    );
    expect(urls).toContain("https://sebavia.com/guides");
    expect(urls).toContain(
      "https://sebavia.com/guides/checklist-road-trip-quebec",
    );
    expect(urls).toContain(
      "https://sebavia.com/guides/budget-road-trip-quebec",
    );
  });

  it("utilise une date lastModified figée", () => {
    const dates = sitemap().map((e) =>
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : String(e.lastModified),
    );
    expect(new Set(dates).size).toBe(1);
    expect(dates[0]).toBe("2026-07-23T22:00:00.000Z");
  });

  it("configure SEO du guide famille", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides/road-trip-famille-quebec",
      title: FAMILY_GUIDE.meta.title,
      description: FAMILY_GUIDE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/guides/road-trip-famille-quebec",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(FAMILY_GUIDE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(FAMILY_GUIDE.meta.description.length).toBeLessThanOrEqual(170);
    expect(FAMILY_GUIDE.hero.title).toMatch(/road trip/i);
    expect(FAMILY_GUIDE.hero.title).toMatch(/famille/i);
    expect(FAMILY_GUIDE.hero.title).toMatch(/Québec/);
  });
});

describe("lot SEO 4C — contenu et garde-fous", () => {
  it("page serveur avec Article, sans HowTo ni auteur fictif", () => {
    const page = readSource("src/app/guides/road-trip-famille-quebec/page.tsx");
    expect(page).toContain("Article");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("articleSection");
    expect(page).not.toContain("HowTo");
    expect(page).not.toContain("MedicalWebPage");
    expect(page).not.toContain('"@type": "Person"');
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/\/api\/v1\//);
  });

  it("exemple fictif et formulations prudentes", () => {
    expect(FAMILY_DAY_EXAMPLE.title).toMatch(/Exemple/i);
    expect(FAMILY_DAY_EXAMPLE.disclaimer).toMatch(/fictif/i);
    expect(FAMILY_DAY_EXAMPLE.disclaimer).toMatch(/Aucun lieu/i);
    const content = readSource(
      "src/features/marketing/lib/family-road-trip-content.ts",
    );
    expect(content).toMatch(/bon rythme dépend/i);
    expect(content).not.toMatch(/durée maximale universelle|règle médicale/i);
    expect(content).not.toMatch(/\bSebavio\b/);
    expect(content).not.toMatch(/\b(Get started|family road trip tips)\b/);
    expect(FAMILY_GUIDE.finalCta.primary.href).toBe("/register");
  });

  it("TOC sans double numérotation", () => {
    const html = renderToStaticMarkup(
      createElement(EditorialToc, { items: FAMILY_GUIDE.toc }),
    );
    expect(html).toContain("list-decimal");
    expect(html).not.toMatch(/1\.\s*1\s*\./);
    expect(html).toContain("Commencer par un cadre réaliste");
  });

  it("maillage entrant", () => {
    expect(ROAD_TRIP_PAGE.group.familyGuideLink.href).toBe(
      "/guides/road-trip-famille-quebec",
    );
    expect(FEATURES_PAGE.personalization.familyGuideLink.href).toBe(
      "/guides/road-trip-famille-quebec",
    );
    const familyUseCase = ASSISTANT_PAGE.useCases.find(
      (u) => u.title === "Sortie familiale",
    );
    expect(familyUseCase && "guideLink" in familyUseCase).toBe(true);
    const faq = readSource("src/app/faq/page.tsx");
    expect(faq).toContain("/guides/road-trip-famille-quebec");
  });
});
