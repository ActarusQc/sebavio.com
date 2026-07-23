import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 3C — sitemap", () => {
  it("inclut /planificateur-road-trip-quebec", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(
      "https://sebavia.com/planificateur-road-trip-quebec",
    );
    expect(urls).toContain(
      "https://sebavia.com/calculateur-cout-carburant-voyage",
    );
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

describe("lot SEO 3C — métadonnées", () => {
  it("configure SEO de la page planificateur", () => {
    const metadata = buildTrustPageMetadata({
      path: "/planificateur-road-trip-quebec",
      title: ROAD_TRIP_PAGE.meta.title,
      description: ROAD_TRIP_PAGE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/planificateur-road-trip-quebec",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.url).toBe(
      "https://sebavia.com/planificateur-road-trip-quebec",
    );
    expect(JSON.stringify(metadata.twitter)).toContain("summary_large_image");
    expect(ROAD_TRIP_PAGE.meta.title).toMatch(
      /planificateur|road trip|Québec/i,
    );
    expect(ROAD_TRIP_PAGE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(ROAD_TRIP_PAGE.meta.description.length).toBeLessThanOrEqual(170);
  });
});

describe("lot SEO 3C — contenu et garde-fous", () => {
  it("expose CTA, FAQ et sections attendues", () => {
    expect(ROAD_TRIP_PAGE.hero.primaryCta.href).toBe("/register");
    expect(ROAD_TRIP_PAGE.hero.secondaryCta.href).toBe("/fonctionnalites");
    expect(ROAD_TRIP_PAGE.finalCta.primary.href).toBe("/register");
    expect(ROAD_TRIP_PAGE.finalCta.secondary.href).toBe("/pricing");
    expect(ROAD_TRIP_PAGE.fuel.featuresLink.href).toBe(
      "/fonctionnalites#carburant",
    );
    expect(ROAD_TRIP_PAGE.faq.items.length).toBeGreaterThanOrEqual(6);
    expect(ROAD_TRIP_PAGE.faq.items.length).toBeLessThanOrEqual(8);
    expect(ROAD_TRIP_PAGE.method.steps.length).toBe(5);
    expect(ROAD_TRIP_PAGE.exampleTrip.label).toBe("Exemple de planification");
  });

  it("page serveur avec WebPage, BreadcrumbList et FAQPage sans HowTo", () => {
    const page = readSource("src/app/planificateur-road-trip-quebec/page.tsx");
    expect(page).toContain("WebPage");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("FAQPage");
    expect(page).toContain("Fonctionnalités");
    expect(page).toContain("Planificateur de road trip au Québec");
    expect(page).not.toContain("HowTo");
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/\b(xAI|OpenAI|OpenWeather|FDE|Google)\b/);
    expect(page).not.toMatch(/Android Auto|CarPlay|navigation GPS en direct/);
    expect(page).not.toMatch(
      /calculateur-cout|planifier-arrets|meteo-voyage|\/gaspesie/,
    );
  });

  it("contenu sans promesses excessives ni anglais public", () => {
    const content = readSource(
      "src/features/marketing/lib/road-trip-page-content.ts",
    );
    expect(content).toContain("Exemple de planification");
    expect(content).toContain("Aucune réservation directe");
    expect(content).toContain("voyage routier");
    expect(content).toContain("road trip");
    expect(content).not.toMatch(/le meilleur trajet|toujours exact/i);
    expect(content).not.toMatch(/\b(Get started|Sign up|Road Trip Planner)\b/);
    expect(content).not.toMatch(/Android Auto|CarPlay/);
  });

  it("FAQ visible alignée sur FAQPage", () => {
    const page = readSource("src/app/planificateur-road-trip-quebec/page.tsx");
    const faq = readSource(
      "src/features/marketing/components/road-trip-faq-section.tsx",
    );
    expect(page).toContain("ROAD_TRIP_PAGE.faq.items");
    expect(faq).toContain("ROAD_TRIP_PAGE");
    for (const item of ROAD_TRIP_PAGE.faq.items) {
      expect(ROAD_TRIP_PAGE.faq.items.some((f) => f.q === item.q)).toBe(true);
    }
  });

  it("maillage depuis les pages existantes", () => {
    expect(FEATURES_PAGE.itinerary.roadTripLink.href).toBe(
      "/planificateur-road-trip-quebec",
    );
    expect(ASSISTANT_PAGE.evolve.roadTripLink.href).toBe(
      "/planificateur-road-trip-quebec",
    );
    const pricing = readSource(
      "src/features/marketing/components/pricing-agent-section.tsx",
    );
    expect(pricing).toContain("/planificateur-road-trip-quebec");
    const faqPage = readSource("src/app/faq/page.tsx");
    expect(faqPage).toContain("/planificateur-road-trip-quebec");
    const home = readSource(
      "src/features/marketing/components/feature-grid.tsx",
    );
    expect(home).toContain("/planificateur-road-trip-quebec");
  });

  it("un seul H1 dans le hero", () => {
    const hero = readSource(
      "src/features/marketing/components/road-trip-page-hero.tsx",
    );
    expect((hero.match(/<h1\b/g) || []).length).toBe(1);
    expect(hero).toMatch(/planificateur/i);
    expect(hero).toMatch(/road trip/i);
    expect(hero).toMatch(/Québec/i);
  });
});
