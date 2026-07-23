import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { FEATURES_PAGE } from "@/features/marketing/lib/features-page-content";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 3A — sitemap", () => {
  it("inclut /fonctionnalites dans l’ordre public attendu", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://sebavia.com/fonctionnalites");
    expect(urls).toContain("https://sebavia.com/assistant-voyage-ia");
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

describe("lot SEO 3A — métadonnées", () => {
  it("configure title, description, canonical, OG, Twitter, robots", () => {
    const metadata = buildTrustPageMetadata({
      path: "/fonctionnalites",
      title: FEATURES_PAGE.meta.title,
      description: FEATURES_PAGE.meta.description,
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://sebavia.com/fonctionnalites",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.url).toBe("https://sebavia.com/fonctionnalites");
    expect(JSON.stringify(metadata.twitter)).toContain("summary_large_image");
    const title =
      typeof metadata.title === "object" &&
      metadata.title &&
      "absolute" in metadata.title
        ? metadata.title.absolute
        : metadata.title;
    expect(title).toBe(FEATURES_PAGE.meta.title);
    expect(FEATURES_PAGE.meta.description.length).toBeGreaterThanOrEqual(120);
    expect(FEATURES_PAGE.meta.description.length).toBeLessThanOrEqual(170);
  });
});

describe("lot SEO 3A — contenu et navigation", () => {
  it("expose les CTA et sections attendues sans routes fantômes", () => {
    expect(FEATURES_PAGE.hero.primaryCta.href).toBe("/register");
    expect(FEATURES_PAGE.hero.secondaryCta.href).toBe("/pricing");
    expect(FEATURES_PAGE.plans.cta.href).toBe("/pricing");
    expect(FEATURES_PAGE.finalCta.primary.href).toBe("/register");
    expect(FEATURES_PAGE.categories.map((c) => c.id)).toEqual([
      "assistant",
      "itineraire",
      "activites",
      "meteo",
      "carburant",
      "personnalisation",
    ]);

    const page = readSource("src/app/fonctionnalites/page.tsx");
    expect(page).toContain("CollectionPage");
    expect(page).toContain("BreadcrumbList");
    expect(page).toContain("ItemList");
    expect(page).toContain('path: "/fonctionnalites"');
    expect(page).not.toMatch(
      /assistant-voyage-ia|planificateur-road-trip|calculateur-cout/,
    );
    expect(page).not.toMatch(/@sebavio\.com|sebavio\.com(?!\/assets)/);
    expect(page).not.toMatch(/\b(best|the best|guaranteed)\b/i);
    expect(page).not.toMatch(/\b(FDE|xAI|OpenWeather|Google Maps)\b/);
  });

  it("pointe header et footer vers /fonctionnalites", () => {
    const header = readSource(
      "src/features/marketing/components/site-header.tsx",
    );
    const footer = readSource(
      "src/features/marketing/components/site-footer.tsx",
    );
    expect(header).toContain('href: "/fonctionnalites"');
    expect(header).not.toContain('href: "/#fonctionnalites"');
    expect(footer).toContain('href: "/fonctionnalites"');
    expect(footer).not.toContain('href: "/#fonctionnalites"');
  });

  it("évite les affirmations non prouvées et le contenu anglais visible dans le contenu source", () => {
    const content = readSource(
      "src/features/marketing/lib/features-page-content.ts",
    );
    expect(content).not.toMatch(/le meilleur|le plus précis|garanti(?!e)/i);
    expect(content).not.toMatch(/\b(Get started|Features|Pricing|Sign up)\b/);
    expect(content).toContain("Créer mon voyage");
    expect(content).toContain("Voir les forfaits");
  });

  it("rend un seul H1 dans le hero", () => {
    const hero = readSource(
      "src/features/marketing/components/features-page-hero.tsx",
    );
    const h1Count = (hero.match(/<h1\b/g) || []).length;
    expect(h1Count).toBe(1);
  });
});
