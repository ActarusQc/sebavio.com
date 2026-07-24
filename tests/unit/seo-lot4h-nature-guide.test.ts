import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { EditorialToc } from "@/features/marketing/components/editorial-toc";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { GUIDES_HUB } from "@/features/marketing/lib/guides-hub-content";
import {
  formatGuideDate,
  getGuideBySlug,
  getPublishedGuides,
  getRelatedGuides,
} from "@/features/marketing/lib/guides-registry";
import {
  NATURE_DAY_EXAMPLE,
  NATURE_GUIDE,
} from "@/features/marketing/lib/nature-road-trip-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 4H — registre et hub", () => {
  it("publie exactement huit guides, nature en premier", () => {
    const guides = getPublishedGuides();
    expect(guides).toHaveLength(8);
    expect(guides.map((g) => g.slug)).toEqual([
      "road-trip-nature-quebec",
      "road-trip-gastronomique-quebec",
      "escapade-fin-de-semaine-quebec",
      "road-trip-solo-quebec",
      "road-trip-couple-quebec",
      "road-trip-famille-quebec",
      "budget-road-trip-quebec",
      "checklist-road-trip-quebec",
    ]);
    expect(guides[0]?.categoryLabel).toBe("Nature");
    expect(formatGuideDate(guides[0]!.publishedAt)).toBe("24 juillet 2026");
    for (const guide of guides) {
      expect(guide.publishedAt <= "2026-07-24").toBe(true);
    }
  });

  it("lie le guide nature et conserve le hero durable", () => {
    const nature = getGuideBySlug("road-trip-nature-quebec")!;
    expect(getRelatedGuides(nature).map((g) => g.slug)).toEqual([
      "escapade-fin-de-semaine-quebec",
      "road-trip-solo-quebec",
      "road-trip-famille-quebec",
    ]);
    expect(GUIDES_HUB.hero.primaryCta.href).toBe("/guides#guides-publies");
  });
});

describe("lot SEO 4H — sitemap et métadonnées", () => {
  it("inclut le guide nature", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(
      "https://sebavia.com/guides/road-trip-nature-quebec",
    );
    expect(urls).toContain(
      "https://sebavia.com/guides/road-trip-gastronomique-quebec",
    );
  });

  it("configure SEO du guide nature", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides/road-trip-nature-quebec",
      title: NATURE_GUIDE.meta.title,
      description: NATURE_GUIDE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/guides/road-trip-nature-quebec",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(NATURE_GUIDE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(NATURE_GUIDE.meta.description.length).toBeLessThanOrEqual(170);
    expect(NATURE_GUIDE.hero.title).toMatch(/nature/i);
    expect(NATURE_GUIDE.hero.title).toMatch(/Québec/);
    expect(NATURE_GUIDE.hero.title).toMatch(/escapade/i);
  });
});

describe("lot SEO 4H — contenu et garde-fous", () => {
  it("page serveur avec Article, sans Park ni auteur", () => {
    const page = readSource("src/app/guides/road-trip-nature-quebec/page.tsx");
    expect(page).toContain("Article");
    expect(page).toContain("BreadcrumbList");
    expect(page).not.toContain("HowTo");
    expect(page).not.toContain('"@type": "Person"');
    expect(page).not.toContain("TouristAttraction");
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
  });

  it("exemple fictif et formulations prudentes", () => {
    expect(NATURE_DAY_EXAMPLE.disclaimer).toMatch(/fictif/i);
    expect(NATURE_DAY_EXAMPLE.disclaimer).toMatch(/Aucun lieu/i);
    const content = readSource(
      "src/features/marketing/lib/nature-road-trip-content.ts",
    );
    expect(content).not.toMatch(/survie|camping sauvage|ignorer.*fermeture/i);
    expect(content).toMatch(/ne garantit ni l’ouverture/i);
    expect(content).toMatch(/n’est pas une source d’alertes/i);
    expect(content).not.toMatch(/\bSebavio\b/);
    expect(content).not.toMatch(/\b(Get started|best hiking trails)\b/);
    expect(NATURE_GUIDE.finalCta.primary.href).toBe("/register");
    expect(NATURE_GUIDE.toc.map((t) => t.id)).toEqual(
      Array.from(new Set(NATURE_GUIDE.toc.map((t) => t.id))),
    );
  });

  it("TOC sans double numérotation", () => {
    const html = renderToStaticMarkup(
      createElement(EditorialToc, { items: NATURE_GUIDE.toc }),
    );
    expect(html).toContain("list-decimal");
    expect(html).not.toMatch(/1\.\s*1\s*\./);
    expect(html).toContain("Choisir un rythme réaliste");
  });

  it("maillage entrant", () => {
    const natureUseCase = ASSISTANT_PAGE.useCases.find(
      (u) => u.title === "Escapade nature",
    );
    expect(natureUseCase && "guideLink" in natureUseCase).toBe(true);
    const weekend = readSource(
      "src/features/marketing/lib/weekend-road-trip-content.ts",
    );
    expect(weekend).toContain("/guides/road-trip-nature-quebec");
    const faq = readSource("src/app/faq/page.tsx");
    expect(faq).toContain("/guides/road-trip-nature-quebec");
  });
});
