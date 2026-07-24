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
import {
  formatGuideDate,
  getGuideBySlug,
  getPublishedGuides,
  getRelatedGuides,
} from "@/features/marketing/lib/guides-registry";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";
import {
  SOLO_DAY_EXAMPLE,
  SOLO_GUIDE,
} from "@/features/marketing/lib/solo-road-trip-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 4E — registre et hub", () => {
  it("publie exactement cinq guides, solo en premier", () => {
    const guides = getPublishedGuides();
    expect(guides).toHaveLength(5);
    expect(guides.map((g) => g.slug)).toEqual([
      "road-trip-solo-quebec",
      "road-trip-couple-quebec",
      "road-trip-famille-quebec",
      "budget-road-trip-quebec",
      "checklist-road-trip-quebec",
    ]);
    expect(guides[0]?.categoryLabel).toBe("Solo");
    expect(guides.some((g) => g.slug === "road-trip-couple-quebec")).toBe(true);
    expect(formatGuideDate(guides[0]!.publishedAt)).toBe("24 juillet 2026");
    expect(formatGuideDate("2026-07-23")).toBe("23 juillet 2026");
    for (const guide of guides) {
      expect(guide.publishedAt <= "2026-07-24").toBe(true);
      expect(guide.updatedAt <= "2026-07-24").toBe(true);
    }
  });

  it("lie le guide solo aux guides connexes", () => {
    const solo = getGuideBySlug("road-trip-solo-quebec")!;
    expect(getRelatedGuides(solo).map((g) => g.slug)).toEqual([
      "checklist-road-trip-quebec",
      "budget-road-trip-quebec",
      "road-trip-couple-quebec",
    ]);
    const couple = getGuideBySlug("road-trip-couple-quebec")!;
    expect(getRelatedGuides(couple).map((g) => g.slug)).toContain(
      "road-trip-solo-quebec",
    );
  });
});

describe("lot SEO 4E — sitemap et métadonnées", () => {
  it("inclut le guide solo et conserve les autres", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://sebavia.com/guides/road-trip-solo-quebec");
    expect(urls).toContain(
      "https://sebavia.com/guides/road-trip-couple-quebec",
    );
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

  it("configure SEO du guide solo", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides/road-trip-solo-quebec",
      title: SOLO_GUIDE.meta.title,
      description: SOLO_GUIDE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/guides/road-trip-solo-quebec",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(SOLO_GUIDE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(SOLO_GUIDE.meta.description.length).toBeLessThanOrEqual(170);
    expect(SOLO_GUIDE.hero.title).toMatch(/road trip/i);
    expect(SOLO_GUIDE.hero.title).toMatch(/solo/i);
    expect(SOLO_GUIDE.hero.title).toMatch(/Québec/);
  });
});

describe("lot SEO 4E — contenu et garde-fous", () => {
  it("page serveur avec Article, sans HowTo ni auteur fictif", () => {
    const page = readSource("src/app/guides/road-trip-solo-quebec/page.tsx");
    expect(page).toContain("Article");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("articleSection");
    expect(page).not.toContain("HowTo");
    expect(page).not.toContain('"@type": "Person"');
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/\/api\/v1\//);
  });

  it("exemple fictif, fatigue et formulations prudentes", () => {
    expect(SOLO_DAY_EXAMPLE.disclaimer).toMatch(/fictif/i);
    expect(SOLO_DAY_EXAMPLE.disclaimer).toMatch(/Aucun lieu/i);
    const content = readSource(
      "src/features/marketing/lib/solo-road-trip-content.ts",
    );
    expect(content).toMatch(/Si la fatigue se fait sentir/i);
    expect(content).toMatch(/personne de confiance/i);
    expect(content).not.toMatch(/autodéfense|gaz poivre|arme/i);
    expect(content).not.toMatch(
      /diffuser publiquement.*(position|localisation)/i,
    );
    expect(content).not.toMatch(
      /conduisez (?:au plus|maximum) \d+\s*(?:h|heures)/i,
    );
    expect(content).not.toMatch(/garantit la sécurité/i);
    expect(content).toMatch(/Aucune réservation directe/i);
    expect(content).toMatch(/n’est ni un service d’urgence/i);
    expect(content).not.toMatch(/\bSebavio\b/);
    expect(content).not.toMatch(/\b(Get started|solo travel safety tips)\b/);
    expect(SOLO_GUIDE.finalCta.primary.href).toBe("/register");
    expect(SOLO_GUIDE.toc.map((t) => t.id)).toEqual(
      Array.from(new Set(SOLO_GUIDE.toc.map((t) => t.id))),
    );
  });

  it("TOC sans double numérotation", () => {
    const html = renderToStaticMarkup(
      createElement(EditorialToc, { items: SOLO_GUIDE.toc }),
    );
    expect(html).toContain("list-decimal");
    expect(html).not.toMatch(/1\.\s*1\s*\./);
    expect(html).toContain("Fatigue et pauses");
  });

  it("maillage entrant", () => {
    expect(ROAD_TRIP_PAGE.group.soloGuideLink.href).toBe(
      "/guides/road-trip-solo-quebec",
    );
    expect(FEATURES_PAGE.personalization.soloGuideLink.href).toBe(
      "/guides/road-trip-solo-quebec",
    );
    const soloUseCase = FEATURES_PAGE.useCases.find((u) => u.id === "solo");
    expect(soloUseCase && "guideLink" in soloUseCase).toBe(true);
    const soloAssistant = ASSISTANT_PAGE.useCases.find(
      (u) => u.title === "Voyage solo",
    );
    expect(soloAssistant && "guideLink" in soloAssistant).toBe(true);
    const faq = readSource("src/app/faq/page.tsx");
    expect(faq).toContain("/guides/road-trip-solo-quebec");
    const checklist = readSource(
      "src/features/marketing/lib/checklist-road-trip-content.ts",
    );
    expect(checklist).toContain("/guides/road-trip-solo-quebec");
  });
});
