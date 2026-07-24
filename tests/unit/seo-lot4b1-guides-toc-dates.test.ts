import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import sitemap from "@/app/sitemap";
import { EditorialToc } from "@/features/marketing/components/editorial-toc";
import { CHECKLIST_GUIDE } from "@/features/marketing/lib/checklist-road-trip-content";
import { BUDGET_GUIDE } from "@/features/marketing/lib/budget-road-trip-content";
import {
  formatGuideDate,
  getGuideBySlug,
  getPublishedGuides,
  toGuideCivilDate,
} from "@/features/marketing/lib/guides-registry";

describe("lot SEO 4B.1 — dates civiles stables", () => {
  it("affiche 23 juillet 2026 pour la checklist sans bascule UTC", () => {
    const checklist = getGuideBySlug("checklist-road-trip-quebec")!;
    expect(toGuideCivilDate(checklist.publishedAt)).toBe("2026-07-23");
    expect(formatGuideDate(checklist.publishedAt)).toBe("23 juillet 2026");
    expect(formatGuideDate("2026-07-23T23:59:59.000Z")).toBe("23 juillet 2026");
    expect(formatGuideDate("2026-07-23T00:00:00.000Z")).toBe("23 juillet 2026");
    expect(formatGuideDate(checklist.publishedAt)).not.toMatch(/24 juillet/);
  });

  it("n’utilise pas de date future pour les guides publiés", () => {
    for (const guide of getPublishedGuides()) {
      expect(guide.publishedAt <= "2026-07-23").toBe(true);
      expect(formatGuideDate(guide.publishedAt)).not.toMatch(/24 juillet 2026/);
    }
  });
});

describe("lot SEO 4B.1 — centre /guides", () => {
  it("expose exactement les deux guides publiés, budget en premier", () => {
    const guides = getPublishedGuides();
    expect(guides).toHaveLength(2);
    expect(guides.map((g) => g.slug)).toEqual([
      "budget-road-trip-quebec",
      "checklist-road-trip-quebec",
    ]);
    expect(guides.every((g) => g.isPublished)).toBe(true);
  });
});

describe("lot SEO 4B.1 — table des matières HTML rendu", () => {
  it("n’a qu’une numérotation (ol) sans préfixe manuel ni 1. 1 .", () => {
    const html = renderToStaticMarkup(
      createElement(EditorialToc, {
        items: CHECKLIST_GUIDE.toc,
      }),
    );

    expect(html).toContain('aria-label="Table des matières"');
    expect(html).toContain("list-decimal");
    expect(html).toContain('href="#cadre"');
    expect(html).toContain("Cadre du voyage");
    expect(html).not.toContain("aria-hidden");
    expect(html).not.toMatch(/>\s*\d+\.\s*</);
    expect(html).not.toMatch(/1\.\s*1\s*\./);
    expect(html).not.toMatch(/2\.\s*2\s*\./);
    expect(html).not.toMatch(/3\.\s*3\s*\./);

    // Simulation crawler sans CSS : texte des ancres sans chiffres manuels.
    const labels = [...html.matchAll(/href="#[^"]+"[^>]*>([^<]+)</g)].map(
      (m) => m[1],
    );
    expect(labels[0]).toBe("Cadre du voyage");
    expect(labels.every((label) => !/^\d+\./.test(label!))).toBe(true);

    const ids = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fonctionne aussi pour le guide Budget", () => {
    const html = renderToStaticMarkup(
      createElement(EditorialToc, {
        items: BUDGET_GUIDE.toc,
      }),
    );
    expect(html).toContain("Principales catégories de dépenses");
    expect(html).not.toMatch(/1\.\s*1\s*\./);
    expect(html).toContain('href="#categories"');
  });
});

describe("lot SEO 4B.1 — sitemap", () => {
  it("contient les trois URLs guides", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://sebavia.com/guides");
    expect(urls).toContain(
      "https://sebavia.com/guides/checklist-road-trip-quebec",
    );
    expect(urls).toContain(
      "https://sebavia.com/guides/budget-road-trip-quebec",
    );
  });
});
