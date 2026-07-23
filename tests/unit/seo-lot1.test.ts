import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_SITE_ORIGIN, getSiteUrl } from "@/lib/site-url";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retourne l’origine canonique par défaut", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN);
  });

  it("normalise le slash final", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sebavia.com/");
    expect(getSiteUrl()).toBe("https://sebavia.com");
  });

  it("refuse l’ancien domaine sebavio.com", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sebavio.com");
    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN);
  });

  it("refuse www.sebavia.com", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.sebavia.com");
    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN);
  });
});

describe("sitemap SEO public", () => {
  it("ne liste que les pages indexables", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toEqual([
      "https://sebavia.com",
      "https://sebavia.com/pricing",
      "https://sebavia.com/faq",
    ]);
    expect(urls.some((u) => u.includes("login"))).toBe(false);
    expect(urls.some((u) => u.includes("register"))).toBe(false);
  });

  it("utilise une date lastModified figée", () => {
    const entries = sitemap();
    const dates = entries.map((e) =>
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : String(e.lastModified),
    );
    expect(new Set(dates).size).toBe(1);
    expect(dates[0]).toBe("2026-07-23T12:00:00.000Z");
  });
});

describe("robots.txt", () => {
  it("pointe le sitemap vers sebavia.com et n’interdit pas /login", () => {
    const conf = robots();
    expect(conf.sitemap).toBe("https://sebavia.com/sitemap.xml");
    const rules = Array.isArray(conf.rules) ? conf.rules[0] : conf.rules;
    expect(rules?.disallow).toEqual(["/dashboard/", "/admin/", "/api/"]);
    expect(JSON.stringify(rules?.disallow)).not.toContain("/login");
  });
});
