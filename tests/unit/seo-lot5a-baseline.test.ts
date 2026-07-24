import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import {
  buildGoogleSiteVerificationMetadata,
  getGoogleSiteVerificationToken,
} from "@/lib/seo/google-site-verification";
import { classifyPublicPageType } from "@/lib/seo/page-type";
import { CANONICAL_SITE_ORIGIN } from "@/lib/site-url";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 5A — inventaire public", () => {
  it("expose exactement les 22 URL publiques attendues via le sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toHaveLength(22);
    expect(urls.every((u) => u.startsWith(CANONICAL_SITE_ORIGIN))).toBe(true);
    expect(urls.some((u) => /sebavio\.com/i.test(u))).toBe(false);
    expect(urls).toContain(
      `${CANONICAL_SITE_ORIGIN}/guides/road-trip-nature-quebec`,
    );
    expect(urls).toContain(`${CANONICAL_SITE_ORIGIN}/fonctionnalites`);
    expect(urls).toContain(`${CANONICAL_SITE_ORIGIN}/pricing`);
  });

  it("classifie les types de pages sans liste parallèle fragile", () => {
    expect(classifyPublicPageType("/")).toBe("home");
    expect(classifyPublicPageType("/guides")).toBe("guides_hub");
    expect(classifyPublicPageType("/guides/road-trip-nature-quebec")).toBe(
      "guide",
    );
    expect(classifyPublicPageType("/assistant-voyage-ia")).toBe("product");
    expect(classifyPublicPageType("/confidentialite")).toBe("legal");
    expect(classifyPublicPageType("/faq")).toBe("institutional");
  });
});

describe("lot SEO 5A — robots et vérification GSC", () => {
  it("robots autorise le public et bloque les zones privées", () => {
    const conf = robots();
    expect(conf.sitemap).toBe(`${CANONICAL_SITE_ORIGIN}/sitemap.xml`);
    expect(conf.host).toBe(CANONICAL_SITE_ORIGIN);
    const rules = Array.isArray(conf.rules) ? conf.rules[0] : conf.rules;
    expect(rules?.allow).toBe("/");
    expect(rules?.disallow).toEqual(
      expect.arrayContaining(["/dashboard/", "/admin/", "/api/"]),
    );
  });

  it("ne lit le jeton meta que depuis l’environnement", () => {
    const prev = process.env.GOOGLE_SITE_VERIFICATION;
    try {
      delete process.env.GOOGLE_SITE_VERIFICATION;
      expect(getGoogleSiteVerificationToken()).toBeUndefined();
      expect(buildGoogleSiteVerificationMetadata()).toBeUndefined();

      process.env.GOOGLE_SITE_VERIFICATION = "test-token-value-ok";
      expect(getGoogleSiteVerificationToken()).toBe("test-token-value-ok");
      expect(buildGoogleSiteVerificationMetadata()).toEqual({
        google: "test-token-value-ok",
      });

      process.env.GOOGLE_SITE_VERIFICATION = "bad token";
      expect(getGoogleSiteVerificationToken()).toBeUndefined();
    } finally {
      if (prev === undefined) delete process.env.GOOGLE_SITE_VERIFICATION;
      else process.env.GOOGLE_SITE_VERIFICATION = prev;
    }
  });

  it("branche la vérification dans le layout sans jeton en dur", () => {
    const layout = readSource("src/app/layout.tsx");
    expect(layout).toContain("buildGoogleSiteVerificationMetadata");
    expect(layout).toContain("verification");
    expect(layout).not.toMatch(
      /google-site-verification["']\s*:\s*["'][a-zA-Z0-9_-]{10,}/,
    );
    expect(readSource(".env.example")).toContain("GOOGLE_SITE_VERIFICATION=");
  });
});

describe("lot SEO 5A — livrables baseline", () => {
  it("documente les actions manuelles GSC", () => {
    const doc = readSource("docs/seo/lot-5a-search-console-baseline.md");
    expect(doc).toMatch(/Search Console/);
    expect(doc).toMatch(/sitemap\.xml/);
    expect(doc).toMatch(/GOOGLE_SITE_VERIFICATION/);
    expect(doc).toMatch(/Présence sitemap ≠ indexation/);
  });

  it("expose le script npm seo:baseline", () => {
    const pkg = JSON.parse(readSource("package.json")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["seo:baseline"]).toContain("seo-baseline.ts");
    expect(existsSync(join(root, "scripts/seo-baseline.ts"))).toBe(true);
  });
});
