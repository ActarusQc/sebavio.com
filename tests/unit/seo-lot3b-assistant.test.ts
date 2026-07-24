import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { ASSISTANT_PAGE } from "@/features/marketing/lib/assistant-page-content";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 3B — sitemap", () => {
  it("inclut /assistant-voyage-ia", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://sebavia.com/assistant-voyage-ia");
    expect(urls).toContain(
      "https://sebavia.com/planificateur-road-trip-quebec",
    );
    expect(urls[0]).toMatch(/^https:\/\/sebavia\.com$/);
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

describe("lot SEO 3B — métadonnées", () => {
  it("configure SEO de la page assistant", () => {
    const metadata = buildTrustPageMetadata({
      path: "/assistant-voyage-ia",
      title: ASSISTANT_PAGE.meta.title,
      description: ASSISTANT_PAGE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/assistant-voyage-ia",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.url).toBe(
      "https://sebavia.com/assistant-voyage-ia",
    );
    expect(JSON.stringify(metadata.twitter)).toContain("summary_large_image");
    expect(ASSISTANT_PAGE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(ASSISTANT_PAGE.meta.description.length).toBeLessThanOrEqual(170);
  });
});

describe("lot SEO 3B — contenu et garde-fous", () => {
  it("expose CTA, FAQ, confidentialité et conditions", () => {
    expect(ASSISTANT_PAGE.hero.primaryCta.href).toBe("/register");
    expect(ASSISTANT_PAGE.hero.secondaryCta.href).toBe("/fonctionnalites");
    expect(ASSISTANT_PAGE.finalCta.secondary.href).toBe("/pricing");
    expect(ASSISTANT_PAGE.privacy.link.href).toBe("/confidentialite");
    expect(
      ASSISTANT_PAGE.reliability.links.some(
        (l) => l.href === "/conditions-utilisation",
      ),
    ).toBe(true);
    expect(ASSISTANT_PAGE.faq.items.length).toBeGreaterThanOrEqual(5);
    expect(ASSISTANT_PAGE.faq.items.length).toBeLessThanOrEqual(8);
  });

  it("page serveur avec WebPage, BreadcrumbList et FAQPage", () => {
    const page = readSource("src/app/assistant-voyage-ia/page.tsx");
    expect(page).toContain("WebPage");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("FAQPage");
    expect(page).toContain("Fonctionnalités");
    expect(page).toContain("Assistant voyage IA");
    expect(page).not.toMatch(/"use client"/);
    expect(page).not.toMatch(/@sebavio\.com/);
    expect(page).not.toMatch(/\b(xAI|OpenAI|OpenWeather|FDE|Google)\b/);
    expect(page).not.toMatch(/réservation directe|Android Auto|CarPlay/);
    expect(page).not.toMatch(/calculateur-cout|meteo-voyage/);
  });

  it("maille vers le planificateur de road trip", () => {
    expect(ASSISTANT_PAGE.evolve.roadTripLink.href).toBe(
      "/planificateur-road-trip-quebec",
    );
  });

  it("contenu sans promesses excessives ni anglais public", () => {
    const content = readSource(
      "src/features/marketing/lib/assistant-page-content.ts",
    );
    expect(content).toContain("Exemple de conversation");
    expect(content).toContain("aucune réservation directe");
    expect(content).toContain("stationné");
    expect(content).not.toMatch(/le meilleur|toujours exact|garanti(?!e)/i);
    expect(content).not.toMatch(/\b(Get started|Sign up|Chatbot)\b/);
    expect(content).not.toMatch(/détour par cette région/);
  });

  it("lien depuis /fonctionnalites et corrections mineures", () => {
    expect(FEATURES_PAGE.assistant.moreLink.href).toBe("/assistant-voyage-ia");
    const useCases = readSource(
      "src/features/marketing/components/features-use-cases.tsx",
    );
    expect(useCases).not.toContain("sans inventer");
    expect(useCases).toContain("accompagner différents types de");
    expect(FEATURES_PAGE.plans.items[0]!.body).not.toContain(
      "Aperçu limité pour explorer",
    );
  });

  it("un seul H1 dans le hero", () => {
    const hero = readSource(
      "src/features/marketing/components/assistant-page-hero.tsx",
    );
    expect((hero.match(/<h1\b/g) || []).length).toBe(1);
  });
});
