import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { parseEmailAddress } from "@/features/marketing/lib/public-contact";
import {
  ABOUT_PAGE,
  CONTACT_PAGE,
  PRIVACY_PAGE,
  TERMS_PAGE,
  LEGAL_LAST_UPDATED_ISO,
} from "@/features/marketing/lib/trust-content";
import { buildTrustPageMetadata } from "@/features/marketing/lib/build-trust-metadata";
import { submitContactMessage } from "@/features/marketing/actions/submit-contact";

describe("sitemap lot SEO 2", () => {
  it("inclut les pages de confiance et exclut l’auth", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://sebavia.com");
    expect(urls).toContain("https://sebavia.com/fonctionnalites");
    expect(urls).toContain("https://sebavia.com/assistant-voyage-ia");
    expect(urls).toContain("https://sebavia.com/pricing");
    expect(urls).toContain("https://sebavia.com/a-propos");
    expect(urls).toContain("https://sebavia.com/faq");
    expect(urls).toContain("https://sebavia.com/contact");
    expect(urls).toContain("https://sebavia.com/confidentialite");
    expect(urls).toContain("https://sebavia.com/conditions-utilisation");
    expect(urls.some((u) => u.includes("login"))).toBe(false);
  });

  it("utilise une date lastModified figée", () => {
    const dates = sitemap().map((e) =>
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : String(e.lastModified),
    );
    expect(new Set(dates).size).toBe(1);
    expect(dates[0]).toMatch(/^2026-07-2[34]T/);
  });
});

describe("métadonnées pages de confiance", () => {
  const cases = [
    { path: "/a-propos" as const, meta: ABOUT_PAGE.meta },
    { path: "/contact" as const, meta: CONTACT_PAGE.meta },
    { path: "/confidentialite" as const, meta: PRIVACY_PAGE.meta },
    {
      path: "/conditions-utilisation" as const,
      meta: TERMS_PAGE.meta,
    },
  ];

  for (const item of cases) {
    it(`configure ${item.path}`, () => {
      const metadata = buildTrustPageMetadata({
        path: item.path,
        title: item.meta.title,
        description: item.meta.description,
      });
      expect(metadata.alternates?.canonical).toBe(
        `https://sebavia.com${item.path}`,
      );
      expect(metadata.robots).toEqual({ index: true, follow: true });
      expect(metadata.openGraph?.url).toBe(`https://sebavia.com${item.path}`);
      const title =
        typeof metadata.title === "object" &&
        metadata.title &&
        "absolute" in metadata.title
          ? metadata.title.absolute
          : metadata.title;
      expect(title).toBe(item.meta.title);
      expect(JSON.stringify(metadata)).not.toContain("sebavio.com");
    });
  }
});

describe("contenu légal", () => {
  it("conserve une date de mise à jour figée", () => {
    expect(LEGAL_LAST_UPDATED_ISO).toBe("2026-07-23");
  });
});

describe("parseEmailAddress", () => {
  it("extrait l’adresse d’un From nommé", () => {
    expect(parseEmailAddress("Sebavia <ops@example.com>")).toBe(
      "ops@example.com",
    );
  });

  it("rejette une valeur invalide", () => {
    expect(parseEmailAddress("pas-une-adresse")).toBeNull();
  });
});

describe("submitContactMessage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("valide les champs obligatoires", async () => {
    vi.stubEnv("CONTACT_EMAIL", "ops@example.com");
    const fd = new FormData();
    fd.set("name", "A");
    fd.set("email", "invalid");
    fd.set("category", "inconnu");
    fd.set("message", "court");
    const result = await submitContactMessage(fd, new Headers());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors).toBeTruthy();
    }
  });
});
