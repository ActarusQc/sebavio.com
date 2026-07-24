import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";
import { FUEL_COST_PAGE } from "@/features/marketing/lib/fuel-cost-page-content";
import { FUEL_STOPS_PAGE } from "@/features/marketing/lib/fuel-stops-page-content";
import { LANDING } from "@/features/marketing/lib/landing-content";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 3E — sitemap", () => {
  it("inclut /planifier-arrets-carburant", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://sebavia.com/planifier-arrets-carburant");
    expect(urls).toContain("https://sebavia.com/meteo-voyage");
    expect(urls[0]).toBe("https://sebavia.com");
  });

  it("utilise une date lastModified figée", () => {
    const dates = sitemap().map((e) =>
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : String(e.lastModified),
    );
    expect(new Set(dates).size).toBe(1);
    expect(dates[0]).toMatch(/^2026-07-23T/);
  });
});

describe("lot SEO 3E — métadonnées", () => {
  it("configure SEO de la page arrêts", () => {
    const metadata = buildTrustPageMetadata({
      path: "/planifier-arrets-carburant",
      title: FUEL_STOPS_PAGE.meta.title,
      description: FUEL_STOPS_PAGE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/planifier-arrets-carburant",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.url).toBe(
      "https://sebavia.com/planifier-arrets-carburant",
    );
    expect(JSON.stringify(metadata.twitter)).toContain("summary_large_image");
    expect(FUEL_STOPS_PAGE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(FUEL_STOPS_PAGE.meta.description.length).toBeLessThanOrEqual(170);
  });
});

describe("lot SEO 3E — contenu et garde-fous", () => {
  it("expose CTA, marge prudente et FAQ", () => {
    expect(FUEL_STOPS_PAGE.hero.primaryCta.href).toBe("/register");
    expect(FUEL_STOPS_PAGE.hero.secondaryCta.href).toBe(
      "/calculateur-cout-carburant-voyage",
    );
    expect(FUEL_STOPS_PAGE.finalCta.secondary.href).toBe("/pricing");
    expect(FUEL_STOPS_PAGE.process.note).toMatch(/marge raisonnable/i);
    expect(FUEL_STOPS_PAGE.faq.items.length).toBeGreaterThanOrEqual(6);
    expect(FUEL_STOPS_PAGE.faq.items.length).toBeLessThanOrEqual(8);
  });

  it("page serveur sans outil anonyme ni carte interactive", () => {
    const page = readSource("src/app/planifier-arrets-carburant/page.tsx");
    expect(page).toContain("WebPage");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("FAQPage");
    expect(page).toContain("Planifier les arrêts de carburant");
    expect(page).not.toContain("HowTo");
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/\b(xAI|OpenAI|OpenWeather|FDE|Google)\b/);
    expect(page).not.toMatch(/meteo-voyage|leaflet|mapbox|geolocation/i);
    expect(page).not.toMatch(/<form\b/i);
  });

  it("contenu sans garantie ni seuil propriétaire", () => {
    const content = readSource(
      "src/features/marketing/lib/fuel-stops-page-content.ts",
    );
    expect(content).toContain("Exemple conceptuel");
    expect(content).toContain("marge raisonnable");
    expect(content).toMatch(
      /garanties ouvertes|disponibilités peuvent changer/i,
    );
    expect(content).not.toMatch(
      /vider le réservoir|dernier kilomètre|presque vide/i,
    );
    expect(content).not.toMatch(/\b(15\s*%|seuil|km restants minimum)\b/i);
    expect(content).not.toMatch(/\b(Get started|Sign up|Gas station)\b/);
    expect(content).not.toMatch(/Petro-Canada|Ultramar|Shell/);
  });

  it("maillage depuis les pages carburant et catalogue", () => {
    expect(FUEL_COST_PAGE.stopsSummary.stopsLink.href).toBe(
      "/planifier-arrets-carburant",
    );
    expect(FEATURES_PAGE.fuel.stopsPlannerLink.href).toBe(
      "/planifier-arrets-carburant",
    );
    expect(ROAD_TRIP_PAGE.fuelStops.stopsLink.href).toBe(
      "/planifier-arrets-carburant",
    );
    expect(ASSISTANT_PAGE.evolve.fuelStopsLink.href).toBe(
      "/planifier-arrets-carburant",
    );
    const pricing = readSource(
      "src/features/marketing/components/pricing-agent-section.tsx",
    );
    expect(pricing).toContain("/planifier-arrets-carburant");
    const faqPage = readSource("src/app/faq/page.tsx");
    expect(faqPage).toContain("/planifier-arrets-carburant");
  });

  it("libellés Calculateur alignés sur consumedFuelValue", () => {
    const ui = readSource(
      "src/features/fuel/components/trip-fuel-settings-card.tsx",
    );
    expect(ui).toContain("consumedFuelValue");
    expect(ui).toContain('label="Coût estimé"');
    expect(FUEL_COST_PAGE.costLabels.items[1]!.term).toBe("Coût estimé");
    expect(FUEL_COST_PAGE.costLabels.items[1]!.definition).toMatch(
      /carburant consommé/i,
    );
    expect(FUEL_COST_PAGE.costLabels.items[1]!.definition).not.toMatch(
      /achats utiles pendant le trajet/i,
    );
    expect(FUEL_COST_PAGE.initialTank.items[2]!.definition).toMatch(
      /carburant consommé/i,
    );
  });

  it("marque publique Sebavia sans Sebavio dans le contenu marketing", () => {
    expect(LANDING.definition).toMatch(/^Sebavia est une plateforme/);
    expect(LANDING.definition).not.toMatch(/Sebavio/);
    const stops = readSource(
      "src/features/marketing/lib/fuel-stops-page-content.ts",
    );
    expect(stops).not.toMatch(/\bSebavio\b/);
  });

  it("un seul H1 dans le hero", () => {
    const hero = readSource(
      "src/features/marketing/components/fuel-stops-page-hero.tsx",
    );
    expect((hero.match(/<h1\b/g) || []).length).toBe(1);
    expect(hero).toMatch(/Planifiez|arrêts|carburant|voyage/i);
  });
});
