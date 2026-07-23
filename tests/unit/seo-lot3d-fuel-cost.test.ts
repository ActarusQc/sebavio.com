import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";
import { FUEL_COST_PAGE } from "@/features/marketing/lib/fuel-cost-page-content";
import { LANDING } from "@/features/marketing/lib/landing-content";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 3D — sitemap", () => {
  it("inclut /calculateur-cout-carburant-voyage", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual([
      "https://sebavia.com",
      "https://sebavia.com/fonctionnalites",
      "https://sebavia.com/assistant-voyage-ia",
      "https://sebavia.com/planificateur-road-trip-quebec",
      "https://sebavia.com/calculateur-cout-carburant-voyage",
      "https://sebavia.com/pricing",
      "https://sebavia.com/a-propos",
      "https://sebavia.com/faq",
      "https://sebavia.com/contact",
      "https://sebavia.com/confidentialite",
      "https://sebavia.com/conditions-utilisation",
    ]);
  });

  it("utilise une date lastModified figée", () => {
    const dates = sitemap().map((e) =>
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : String(e.lastModified),
    );
    expect(new Set(dates).size).toBe(1);
    expect(dates[0]).toBe("2026-07-23T21:00:00.000Z");
  });
});

describe("lot SEO 3D — métadonnées", () => {
  it("configure SEO de la page calculateur", () => {
    const metadata = buildTrustPageMetadata({
      path: "/calculateur-cout-carburant-voyage",
      title: FUEL_COST_PAGE.meta.title,
      description: FUEL_COST_PAGE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/calculateur-cout-carburant-voyage",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.url).toBe(
      "https://sebavia.com/calculateur-cout-carburant-voyage",
    );
    expect(JSON.stringify(metadata.twitter)).toContain("summary_large_image");
    expect(FUEL_COST_PAGE.meta.title).toMatch(/calculateur|coût|carburant/i);
    expect(FUEL_COST_PAGE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(FUEL_COST_PAGE.meta.description.length).toBeLessThanOrEqual(170);
  });
});

describe("lot SEO 3D — contenu et garde-fous", () => {
  it("expose CTA, formule, exemple fictif et FAQ", () => {
    expect(FUEL_COST_PAGE.hero.primaryCta.href).toBe("/register");
    expect(FUEL_COST_PAGE.hero.secondaryCta.href).toBe(
      "/fonctionnalites#carburant",
    );
    expect(FUEL_COST_PAGE.finalCta.secondary.href).toBe("/pricing");
    expect(FUEL_COST_PAGE.formula.liters).toMatch(/distance/i);
    expect(FUEL_COST_PAGE.example.label).toBe("Exemple de calcul");
    expect(FUEL_COST_PAGE.example.disclaimer).toMatch(/fictives/i);
    expect(FUEL_COST_PAGE.faq.items.length).toBeGreaterThanOrEqual(6);
    expect(FUEL_COST_PAGE.faq.items.length).toBeLessThanOrEqual(8);
  });

  it("page serveur avec WebPage, BreadcrumbList et FAQPage", () => {
    const page = readSource(
      "src/app/calculateur-cout-carburant-voyage/page.tsx",
    );
    expect(page).toContain("WebPage");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("FAQPage");
    expect(page).toContain("Calculateur de coût de carburant");
    expect(page).not.toContain("HowTo");
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/\b(xAI|OpenAI|OpenWeather|FDE|Google)\b/);
    expect(page).not.toMatch(/planifier-arrets-carburant|meteo-voyage/);
    expect(page).not.toMatch(/<form\b/i);
  });

  it("contenu sans prix actuel ni calculateeur public complet", () => {
    const content = readSource(
      "src/features/marketing/lib/fuel-cost-page-content.ts",
    );
    expect(content).toContain("Exemple de calcul");
    expect(content).toContain("Valeurs fictives");
    expect(content).toContain("litres aux 100");
    expect(content).not.toMatch(/est le prix actuel/i);
    expect(content).toMatch(/n’est pas un prix garanti|non garanti/i);
    expect(content).not.toMatch(/le prix du carburant est garanti/i);
    expect(content).not.toMatch(/\b(Get started|Sign up|Fuel calculator)\b/);
    expect(content).not.toMatch(/planifier-arrets-carburant/);
  });

  it("maillage depuis les pages existantes", () => {
    expect(FEATURES_PAGE.fuel.costCalculatorLink.href).toBe(
      "/calculateur-cout-carburant-voyage",
    );
    expect(ROAD_TRIP_PAGE.fuel.costCalculatorLink.href).toBe(
      "/calculateur-cout-carburant-voyage",
    );
    expect(ASSISTANT_PAGE.evolve.fuelCostLink.href).toBe(
      "/calculateur-cout-carburant-voyage",
    );
    const pricing = readSource(
      "src/features/marketing/components/pricing-agent-section.tsx",
    );
    expect(pricing).toContain("/calculateur-cout-carburant-voyage");
    const faqPage = readSource("src/app/faq/page.tsx");
    expect(faqPage).toContain("/calculateur-cout-carburant-voyage");
    const home = readSource(
      "src/features/marketing/components/feature-grid.tsx",
    );
    expect(home).toContain("/calculateur-cout-carburant-voyage");
  });

  it("marque publique Sebavia dans le pied de page", () => {
    expect(LANDING.definition).toMatch(/^Sebavia est une plateforme/);
    expect(LANDING.definition).not.toMatch(/Sebavio/);
    const landing = readSource("src/features/marketing/lib/landing-content.ts");
    expect(landing).not.toMatch(/\bSebavio\b/);
    const footer = readSource(
      "src/features/marketing/components/site-footer.tsx",
    );
    expect(footer).toContain("LANDING.definition");
  });

  it("un seul H1 dans le hero", () => {
    const hero = readSource(
      "src/features/marketing/components/fuel-cost-page-hero.tsx",
    );
    expect((hero.match(/<h1\b/g) || []).length).toBe(1);
    expect(hero).toMatch(/calculateur/i);
    expect(hero).toMatch(/coût/i);
    expect(hero).toMatch(/carburant/i);
    expect(hero).toMatch(/voyage/i);
  });
});
