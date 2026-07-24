import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";
import { LANDING } from "@/features/marketing/lib/landing-content";
import { ROAD_TRIP_PAGE } from "@/features/marketing/lib/road-trip-page-content";
import { WEATHER_PAGE } from "@/features/marketing/lib/weather-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 3F — sitemap", () => {
  it("inclut /meteo-voyage", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://sebavia.com/meteo-voyage");
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
});

describe("lot SEO 3F — métadonnées", () => {
  it("configure SEO de la page météo", () => {
    const metadata = buildTrustPageMetadata({
      path: "/meteo-voyage",
      title: WEATHER_PAGE.meta.title,
      description: WEATHER_PAGE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/meteo-voyage",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.url).toBe("https://sebavia.com/meteo-voyage");
    expect(JSON.stringify(metadata.twitter)).toContain("summary_large_image");
    expect(WEATHER_PAGE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(WEATHER_PAGE.meta.description.length).toBeLessThanOrEqual(170);
  });
});

describe("lot SEO 3F — contenu et garde-fous", () => {
  it("expose CTA, limites et FAQ", () => {
    expect(WEATHER_PAGE.hero.primaryCta.href).toBe("/register");
    expect(WEATHER_PAGE.hero.secondaryCta.href).toBe(
      "/planificateur-road-trip-quebec",
    );
    expect(WEATHER_PAGE.hero.featuresLink.href).toBe("/fonctionnalites#meteo");
    expect(WEATHER_PAGE.finalCta.secondary.href).toBe("/pricing");
    expect(WEATHER_PAGE.roads.note).toMatch(/sources officielles/i);
    expect(WEATHER_PAGE.faq.items.length).toBeGreaterThanOrEqual(6);
    expect(WEATHER_PAGE.faq.items.length).toBeLessThanOrEqual(8);
  });

  it("page serveur sans outil météo anonyme ni API", () => {
    const page = readSource("src/app/meteo-voyage/page.tsx");
    expect(page).toContain("WebPage");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("FAQPage");
    expect(page).toContain("Météo du voyage");
    expect(page).not.toContain("HowTo");
    expect(page).not.toContain("WeatherForecast");
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/\b(Open-Meteo|OpenWeather|xAI|FDE)\b/);
    expect(page).not.toMatch(/geolocation|leaflet|mapbox|radar/i);
    expect(page).not.toMatch(/<form\b/i);
    expect(page).not.toMatch(/\/api\/v1\/weather/);
  });

  it("contenu fictif et sans garantie", () => {
    const content = readSource(
      "src/features/marketing/lib/weather-page-content.ts",
    );
    expect(content).toContain("Exemple de présentation");
    expect(content).toContain("Données fictives");
    expect(content).toContain("Au départ");
    expect(content).toContain("À l’arrivée");
    expect(content).not.toMatch(/précision garantie|toujours exact/i);
    expect(content).not.toMatch(/\b(Get started|Sign up|Weather radar)\b/);
    expect(content).not.toMatch(/Open-Meteo|OpenWeather/);
  });

  it("maillage depuis les pages existantes", () => {
    expect(FEATURES_PAGE.weather.weatherPageLink.href).toBe("/meteo-voyage");
    expect(ROAD_TRIP_PAGE.weather.weatherPageLink.href).toBe("/meteo-voyage");
    expect(ASSISTANT_PAGE.evolve.weatherPageLink.href).toBe("/meteo-voyage");
    const pricing = readSource(
      "src/features/marketing/components/pricing-agent-section.tsx",
    );
    expect(pricing).toContain("/meteo-voyage");
    const faqPage = readSource("src/app/faq/page.tsx");
    expect(faqPage).toContain("/meteo-voyage");
    const home = readSource(
      "src/features/marketing/components/feature-grid.tsx",
    );
    expect(home).toContain("/meteo-voyage");
  });

  it("marque publique Sebavia", () => {
    expect(LANDING.definition).toMatch(/^Sebavia est une plateforme/);
    const content = readSource(
      "src/features/marketing/lib/weather-page-content.ts",
    );
    expect(content).not.toMatch(/\bSebavio\b/);
  });

  it("un seul H1 dans le hero", () => {
    const hero = readSource(
      "src/features/marketing/components/weather-page-hero.tsx",
    );
    expect((hero.match(/<h1\b/g) || []).length).toBe(1);
    expect(hero).toMatch(/[Mm]étéo/);
    expect(hero).toMatch(/voyage|prévisions|trajet/i);
  });
});
