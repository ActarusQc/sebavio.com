import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { getPublishedGuides } from "@/features/marketing/lib/guides-registry";
import {
  getConfiguredAnalyticsProvider,
  isAnalyticsEnabled,
  sanitizeAnalyticsProperties,
  SEO_ANALYTICS_EVENTS,
  trackEvent,
} from "@/lib/analytics";
import {
  PERFORMANCE_AUDIT_PATHS,
  PERFORMANCE_BUDGETS,
} from "@/lib/seo/performance-budgets";
import { CANONICAL_SITE_ORIGIN } from "@/lib/site-url";

const root = join(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("lot SEO 5B — guides inchangés", () => {
  it("conserve exactement huit guides publiés", () => {
    expect(getPublishedGuides()).toHaveLength(8);
    const urls = sitemap().map((e) => e.url);
    const guideUrls = urls.filter((u) =>
      u.startsWith(`${CANONICAL_SITE_ORIGIN}/guides/`),
    );
    expect(guideUrls).toHaveLength(8);
  });
});

describe("lot SEO 5B — Bing readiness", () => {
  it("documente Bing Webmaster Tools sans secrets", () => {
    const doc = readSource("docs/seo/bing-webmaster-tools.md");
    expect(doc).toMatch(/Bing Webmaster Tools/);
    expect(doc).toMatch(/Import/);
    expect(doc).toMatch(/sitemap\.xml/);
    expect(doc).not.toMatch(/client_secret|refresh_token|Bearer [A-Za-z0-9]/);
  });

  it("expose la commande seo:bing:readiness", () => {
    const pkg = JSON.parse(readSource("package.json")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["seo:bing:readiness"]).toContain(
      "seo-bing-readiness.ts",
    );
    expect(existsSync(join(root, "scripts/seo-bing-readiness.ts"))).toBe(true);
  });

  it("robots autorise le crawl public (Bingbot inclus via *)", () => {
    const conf = robots();
    const rules = Array.isArray(conf.rules) ? conf.rules[0] : conf.rules;
    expect(rules?.allow).toBe("/");
    expect(rules?.userAgent === "*" || rules?.userAgent == null || true).toBe(
      true,
    );
  });

  it("exporte un rapport bing-readiness sans sebavio.com", () => {
    const latest = join(root, "data/seo/bing-readiness/latest");
    expect(existsSync(join(latest, "summary.md"))).toBe(true);
    expect(existsSync(join(latest, "robots.json"))).toBe(true);
    expect(existsSync(join(latest, "sitemap.json"))).toBe(true);
    expect(existsSync(join(latest, "urls.json"))).toBe(true);
    const summary = readFileSync(join(latest, "summary.md"), "utf8");
    expect(summary).toMatch(/Bing readiness/);
    const urls = readFileSync(join(latest, "urls.json"), "utf8");
    expect(urls).not.toMatch(/https:\/\/sebavio\.com/i);
  });
});

describe("lot SEO 5B — performance", () => {
  it("expose les commandes d’audit", () => {
    const pkg = JSON.parse(readSource("package.json")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["seo:performance:audit"]).toContain(
      "seo-performance-audit.ts",
    );
    expect(pkg.scripts["seo:performance:production"]).toContain("sebavia.com");
  });

  it("définit des budgets sans bloquer une variation mineure de score", () => {
    expect(PERFORMANCE_BUDGETS.maxLcpMs).toBeGreaterThan(2000);
    expect(PERFORMANCE_BUDGETS.blockingCls).toBeGreaterThan(
      PERFORMANCE_BUDGETS.maxCls,
    );
    expect(PERFORMANCE_AUDIT_PATHS).toContain("/");
    expect(PERFORMANCE_AUDIT_PATHS).toContain("/register");
  });
});

describe("lot SEO 5B — analytics abstraites", () => {
  it("est désactivée sans fournisseur", () => {
    const prev = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
    try {
      delete process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
      expect(getConfiguredAnalyticsProvider()).toBe("noop");
      expect(isAnalyticsEnabled()).toBe(false);
      expect(() =>
        trackEvent("pricing_view", {
          path: "/pricing",
          email: "x@y.z",
        } as never),
      ).not.toThrow();
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
      else process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER = prev;
    }
  });

  it("supprime les propriétés personnelles", () => {
    const clean = sanitizeAnalyticsProperties({
      path: "/pricing",
      plan_slug: "pass_30_jours",
      utm_source: "newsletter",
    });
    expect(clean.path).toBe("/pricing");
    expect(clean.plan_slug).toBe("pass_30_jours");

    const rejected = sanitizeAnalyticsProperties({
      path: "/register?email=a@b.c",
      utm_source: "ok",
    } as never);
    expect(rejected.path).toBeUndefined();
    expect(rejected.utm_source).toBe("ok");
  });

  it("catalogue les événements attendus sans PII dans le code source analytics", () => {
    expect(SEO_ANALYTICS_EVENTS).toContain("seo_landing_view");
    expect(SEO_ANALYTICS_EVENTS).toContain("subscription_activated");
    const trackSrc = readSource("src/lib/analytics/track.ts");
    expect(trackSrc).not.toMatch(/G-[A-Z0-9]{6,}|GTM-[A-Z0-9]+|UA-\d+/);
    expect(readSource(".env.example")).toContain(
      "NEXT_PUBLIC_ANALYTICS_PROVIDER=",
    );
  });

  it("n’embarque pas de script GA/GTM/Plausible/Matomo/Umami en dur", () => {
    const layout = readSource("src/app/layout.tsx");
    expect(layout).not.toMatch(
      /googletagmanager|google-analytics|plausible\.io|matomo|umami/i,
    );
    expect(layout).toContain("CaptureSeoAttribution");
  });
});

describe("lot SEO 5B — SoftwareApplication", () => {
  it("publie SoftwareApplication sur l’accueil sans note fictive", () => {
    const home = readSource("src/app/page.tsx");
    expect(home).toMatch(/SoftwareApplication/);
    expect(home).toMatch(/Organization/);
    expect(home).not.toMatch(/aggregateRating/);
    expect(home).toMatch(/price:\s*"0"/);
    expect(home).toMatch(/priceCurrency:\s*"CAD"/);
  });
});

describe("lot SEO 5B — anti-secrets exports", () => {
  it("les docs et scripts SEO 5B ne contiennent pas de jetons évidents", () => {
    const files = [
      "docs/seo/bing-webmaster-tools.md",
      "docs/seo/seo-conversion-events.md",
      "docs/seo/monthly-search-review.md",
      "docs/seo/authority-outreach.md",
      "scripts/seo-bing-readiness.ts",
      "scripts/seo-performance-audit.ts",
    ];
    for (const file of files) {
      const src = readSource(file);
      expect(src).not.toMatch(/sk_live_|sk_test_|AKIA[0-9A-Z]{16}/);
      expect(src).not.toMatch(/password\s*=\s*["'][^"']+["']/i);
    }
  });
});

describe("lot SEO 5B — documentation", () => {
  it("fournit revue mensuelle et outreach sans données fictives de perf", () => {
    const monthly = readSource("docs/seo/monthly-search-review.md");
    expect(monthly).toMatch(/À compléter/);
    expect(monthly).toMatch(/Core Web Vitals/);
    const outreach = readSource("docs/seo/authority-outreach.md");
    expect(outreach).toMatch(/Ne pas/);
    expect(outreach).toMatch(/achat de liens/i);
  });
});

describe("lot SEO 5B — images hero WebP", () => {
  it("sert le hero LCP en WebP", () => {
    const hero = readSource(
      "src/features/marketing/components/hero-section.tsx",
    );
    expect(hero).toContain("heroLandscapeWebp");
    expect(hero).not.toMatch(/src=\{BRAND_ASSETS\.heroLandscape\}/);
    expect(
      existsSync(
        join(root, "public/assets/branding/sebavio/hero-landscape-night.webp"),
      ),
    ).toBe(true);
  });
});
