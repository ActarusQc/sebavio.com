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
  GASTRONOMY_DAY_EXAMPLE,
  GASTRONOMY_GUIDE,
} from "@/features/marketing/lib/gastronomy-road-trip-content";
import { GUIDES_HUB } from "@/features/marketing/lib/guides-hub-content";
import {
  formatGuideDate,
  getGuideBySlug,
  getPublishedGuides,
  getRelatedGuides,
} from "@/features/marketing/lib/guides-registry";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 4G — registre et hub", () => {
  it("publie exactement sept guides, gastronomie en premier", () => {
    const guides = getPublishedGuides();
    expect(guides).toHaveLength(7);
    expect(guides.map((g) => g.slug)).toEqual([
      "road-trip-gastronomique-quebec",
      "escapade-fin-de-semaine-quebec",
      "road-trip-solo-quebec",
      "road-trip-couple-quebec",
      "road-trip-famille-quebec",
      "budget-road-trip-quebec",
      "checklist-road-trip-quebec",
    ]);
    expect(guides[0]?.categoryLabel).toBe("Gastronomie");
    expect(formatGuideDate(guides[0]!.publishedAt)).toBe("24 juillet 2026");
    for (const guide of guides) {
      expect(guide.publishedAt <= "2026-07-24").toBe(true);
    }
  });

  it("lie le guide gastronomie et conserve le hero durable", () => {
    const gastro = getGuideBySlug("road-trip-gastronomique-quebec")!;
    expect(getRelatedGuides(gastro).map((g) => g.slug)).toEqual([
      "escapade-fin-de-semaine-quebec",
      "road-trip-couple-quebec",
      "budget-road-trip-quebec",
    ]);
    expect(GUIDES_HUB.hero.primaryCta.href).toBe("/guides#guides-publies");
  });
});

describe("lot SEO 4G — sitemap et métadonnées", () => {
  it("inclut le guide gastronomique", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(
      "https://sebavia.com/guides/road-trip-gastronomique-quebec",
    );
    expect(urls).toContain(
      "https://sebavia.com/guides/escapade-fin-de-semaine-quebec",
    );
  });

  it("configure SEO du guide gastronomique", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides/road-trip-gastronomique-quebec",
      title: GASTRONOMY_GUIDE.meta.title,
      description: GASTRONOMY_GUIDE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/guides/road-trip-gastronomique-quebec",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(GASTRONOMY_GUIDE.meta.description.length).toBeGreaterThanOrEqual(
      120,
    );
    expect(GASTRONOMY_GUIDE.meta.description.length).toBeLessThanOrEqual(170);
    expect(GASTRONOMY_GUIDE.hero.title).toMatch(/gastronomique/i);
    expect(GASTRONOMY_GUIDE.hero.title).toMatch(/Québec/);
    expect(GASTRONOMY_GUIDE.hero.title).toMatch(/gourmande/i);
  });
});

describe("lot SEO 4G — contenu et garde-fous", () => {
  it("page serveur avec Article, sans Restaurant ni auteur", () => {
    const page = readSource(
      "src/app/guides/road-trip-gastronomique-quebec/page.tsx",
    );
    expect(page).toContain("Article");
    expect(page).toContain("BreadcrumbList");
    expect(page).not.toContain("HowTo");
    expect(page).not.toContain('"@type": "Person"');
    expect(page).not.toContain("LocalBusiness");
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
  });

  it("exemple fictif, sans alcool ni commerce réel", () => {
    expect(GASTRONOMY_DAY_EXAMPLE.disclaimer).toMatch(/fictif/i);
    expect(GASTRONOMY_DAY_EXAMPLE.disclaimer).toMatch(/Aucun commerce/i);
    const content = readSource(
      "src/features/marketing/lib/gastronomy-road-trip-content.ts",
    );
    expect(content).not.toMatch(
      /\b(vin|vins|vignoble|microbrasserie|distillerie|cidrerie|cocktail|alcool)\b/i,
    );
    expect(content).toMatch(/Aucune réservation directe|ne réserve pas/i);
    expect(content).toMatch(/allergie/i);
    expect(content).not.toMatch(/conseil médical/i);
    expect(content).not.toMatch(/\bSebavio\b/);
    expect(content).not.toMatch(/\b(Get started|best restaurants)\b/);
    expect(GASTRONOMY_GUIDE.finalCta.primary.href).toBe("/register");
    expect(GASTRONOMY_GUIDE.finalCta.secondary.href).toBe(
      "/assistant-voyage-ia",
    );
    expect(GASTRONOMY_GUIDE.toc.map((t) => t.id)).toEqual(
      Array.from(new Set(GASTRONOMY_GUIDE.toc.map((t) => t.id))),
    );
  });

  it("TOC sans double numérotation", () => {
    const html = renderToStaticMarkup(
      createElement(EditorialToc, { items: GASTRONOMY_GUIDE.toc }),
    );
    expect(html).toContain("list-decimal");
    expect(html).not.toMatch(/1\.\s*1\s*\./);
    expect(html).toContain("Choisir une priorité gourmande");
  });

  it("maillage entrant", () => {
    const weekend = readSource(
      "src/features/marketing/lib/weekend-road-trip-content.ts",
    );
    expect(weekend).toContain("/guides/road-trip-gastronomique-quebec");
    const couple = readSource(
      "src/features/marketing/lib/couple-road-trip-content.ts",
    );
    expect(couple).toContain("/guides/road-trip-gastronomique-quebec");
    const gastroUseCase = ASSISTANT_PAGE.useCases.find(
      (u) => u.title === "Voyage gastronomique",
    );
    expect(gastroUseCase && "guideLink" in gastroUseCase).toBe(true);
    const faq = readSource("src/app/faq/page.tsx");
    expect(faq).toContain("/guides/road-trip-gastronomique-quebec");
  });
});
