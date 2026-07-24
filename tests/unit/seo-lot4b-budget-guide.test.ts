import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import {
  BUDGET_FICTIONAL_EXAMPLE,
  BUDGET_FICTIONAL_TOTAL,
  BUDGET_GUIDE,
} from "@/features/marketing/lib/budget-road-trip-content";
import { FUEL_COST_PAGE } from "@/features/marketing/lib/fuel-cost-page-content";
import {
  formatGuideDate,
  getGuideBySlug,
  getPublishedGuides,
  getRelatedGuides,
  GUIDE_EDITORIAL_TIMEZONE,
} from "@/features/marketing/lib/guides-registry";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 4B — corrections guide checklist", () => {
  it("corrige la date du premier guide au 23 juillet 2026 (Québec)", () => {
    const checklist = getGuideBySlug("checklist-road-trip-quebec");
    expect(checklist?.publishedAt).toBe("2026-07-23T16:00:00.000Z");
    expect(checklist?.updatedAt).toBe("2026-07-23T16:00:00.000Z");
    expect(formatGuideDate(checklist!.publishedAt)).toBe("23 juillet 2026");
    expect(GUIDE_EDITORIAL_TIMEZONE).toBe("America/Toronto");
    expect(formatGuideDate("2026-07-24T03:00:00.000Z")).toBe("23 juillet 2026");
  });

  it("évite la numérotation doublée dans la table des matières", () => {
    const toc = readSource(
      "src/features/marketing/components/editorial-toc.tsx",
    );
    expect(toc).toContain("list-none");
    expect(toc).toContain("aria-hidden");
    expect((toc.match(/index \+ 1/g) || []).length).toBe(1);
    const checklistToc = readSource(
      "src/features/marketing/lib/checklist-road-trip-content.ts",
    );
    expect(checklistToc).toMatch(/label:\s*"Cadre du voyage"/);
    expect(checklistToc).not.toMatch(/label:\s*"\d+\.\s*Cadre/);
  });
});

describe("lot SEO 4B — registre et hub", () => {
  it("publie le guide budget et trie du plus récent au plus ancien", () => {
    const guides = getPublishedGuides();
    expect(guides.map((g) => g.slug)).toEqual([
      "budget-road-trip-quebec",
      "checklist-road-trip-quebec",
    ]);
    expect(guides[0]?.categoryLabel).toBe("Budget");
    expect(guides[1]?.categoryLabel).toBe("Préparation");
  });

  it("lie les deux guides entre eux", () => {
    const budget = getGuideBySlug("budget-road-trip-quebec")!;
    const checklist = getGuideBySlug("checklist-road-trip-quebec")!;
    expect(getRelatedGuides(budget).map((g) => g.slug)).toContain(
      "checklist-road-trip-quebec",
    );
    expect(getRelatedGuides(checklist).map((g) => g.slug)).toContain(
      "budget-road-trip-quebec",
    );
  });
});

describe("lot SEO 4B — sitemap et métadonnées", () => {
  it("inclut le guide budget", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(
      "https://sebavia.com/guides/budget-road-trip-quebec",
    );
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
    expect(dates[0]).toBe("2026-07-23T20:00:00.000Z");
  });

  it("configure SEO du guide budget", () => {
    const metadata = buildTrustPageMetadata({
      path: "/guides/budget-road-trip-quebec",
      title: BUDGET_GUIDE.meta.title,
      description: BUDGET_GUIDE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/guides/budget-road-trip-quebec",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(BUDGET_GUIDE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(BUDGET_GUIDE.meta.description.length).toBeLessThanOrEqual(170);
    expect(BUDGET_GUIDE.hero.title).toMatch(/budget/i);
    expect(BUDGET_GUIDE.hero.title).toMatch(/road trip/i);
    expect(BUDGET_GUIDE.hero.title).toMatch(/Québec/);
  });
});

describe("lot SEO 4B — contenu et garde-fous", () => {
  it("page serveur avec Article, sans HowTo ni auteur fictif", () => {
    const page = readSource("src/app/guides/budget-road-trip-quebec/page.tsx");
    expect(page).toContain("Article");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("WebPage");
    expect(page).not.toContain("HowTo");
    expect(page).not.toContain("AggregateRating");
    expect(page).not.toContain('"@type": "Person"');
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/<form\b/i);
    expect(page).not.toMatch(/\/api\/v1\//);
  });

  it("exemple fictif avec total exact et mentions de prudence", () => {
    expect(BUDGET_FICTIONAL_TOTAL).toBe(
      BUDGET_FICTIONAL_EXAMPLE.rows.reduce((s, r) => s + r.amount, 0),
    );
    expect(BUDGET_FICTIONAL_TOTAL).toBe(900);
    expect(BUDGET_FICTIONAL_EXAMPLE.title).toMatch(/fictif/i);
    expect(BUDGET_FICTIONAL_EXAMPLE.disclaimer).toMatch(
      /uniquement à illustrer/i,
    );
    expect(BUDGET_FICTIONAL_EXAMPLE.disclaimer).toMatch(/prix réels varient/i);
    const content = readSource(
      "src/features/marketing/lib/budget-road-trip-content.ts",
    );
    expect(content).toMatch(/pas les prix actuels/i);
    expect(content).not.toMatch(/moyenne universelle/i);
    expect(content).toMatch(/conseil financier personnalisé/i);
    expect(content).not.toMatch(/\bSebavio\b/);
    expect(content).not.toMatch(/\b(Get started|Sign up|budget calculator)\b/);
  });

  it("maillage entrant et sortant", () => {
    expect(FUEL_COST_PAGE.updates.budgetGuideLink.href).toBe(
      "/guides/budget-road-trip-quebec",
    );
    expect(ROAD_TRIP_PAGE.fuel.budgetGuideLink.href).toBe(
      "/guides/budget-road-trip-quebec",
    );
    const faq = readSource("src/app/faq/page.tsx");
    expect(faq).toContain("/guides/budget-road-trip-quebec");
    expect(BUDGET_GUIDE.finalCta.primary.href).toBe("/register");
    expect(BUDGET_GUIDE.hero.primaryCta.href).toBe(
      "/calculateur-cout-carburant-voyage",
    );
    const related = readSource(
      "src/features/marketing/components/guide-related-guides.tsx",
    );
    expect(related).toContain("À lire aussi");
    expect(related).toContain("getRelatedGuides");
  });

  it("styles d’impression pour tableau et mention Sebavia", () => {
    const css = readSource("src/app/globals.css");
    expect(css).toContain("guide-budget-table");
    expect(css).toContain("https://sebavia.com");
    expect(css).toContain("guide-no-print");
  });
});
