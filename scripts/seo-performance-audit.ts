/**
 * Lot SEO 5B — Audit Lighthouse (laboratoire) + comparaison baseline.
 * Usage :
 *   npm run seo:performance:audit
 *   npm run seo:performance:production
 *
 * Données Lighthouse = laboratoire uniquement (pas des Core Web Vitals réels utilisateurs).
 * INP terrain : non disponible ici — TBT utilisé comme indicateur de lab.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { CANONICAL_SITE_ORIGIN } from "../src/lib/site-url";

const ORIGIN = process.env.SEO_PERF_ORIGIN?.trim() || CANONICAL_SITE_ORIGIN;
const ROOT = join(__dirname, "..");
const EXECUTION_ID = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "Z");

const PATHS = [
  "/",
  "/fonctionnalites",
  "/pricing",
  "/assistant-voyage-ia",
  "/planificateur-road-trip-quebec",
  "/guides",
  "/guides/road-trip-nature-quebec",
  "/guides/road-trip-gastronomique-quebec",
  "/register",
] as const;

/** Budgets indicatifs (pages marketing) — ne bloquent pas pour une variation mineure de score. */
const BUDGETS = {
  maxTransferKb: 3500,
  maxJsKb: 900,
  maxCssKb: 200,
  maxImageKb: 1500,
  maxLcpMs: 4000,
  maxCls: 0.25,
  maxTbtMs: 600,
  minPerfScore: 0.35,
  regressionPerfPoints: 0.15,
  regressionLcpMs: 1500,
  regressionCls: 0.1,
  blockingImageKb: 2500,
  blockingCls: 0.4,
} as const;

type FormFactor = "mobile" | "desktop";

type PageMetrics = {
  url: string;
  path: string;
  formFactor: FormFactor;
  httpStatus: number | null;
  performanceScore: number | null;
  lcpMs: number | null;
  tbtMs: number | null;
  inpMs: null;
  cls: number | null;
  fcpMs: number | null;
  speedIndexMs: number | null;
  totalByteWeight: number | null;
  jsBytes: number | null;
  cssBytes: number | null;
  imageBytes: number | null;
  fontBytes: number | null;
  requestCount: number | null;
  renderBlockingCount: number | null;
  mainIssues: string[];
  severity: "ok" | "avertissement" | "erreur";
  proposedFix: string;
  dataKind: "laboratory_lighthouse";
  fieldDataAvailable: false;
  fieldDataNote: string;
};

type Opportunity = {
  path: string;
  formFactor: FormFactor;
  id: string;
  title: string;
  score: number | null;
  displayValue: string | null;
  severity: "ok" | "avertissement" | "erreur";
};

function kb(bytes: number | null): string {
  if (bytes == null) return "n/d";
  return `${(bytes / 1024).toFixed(0)} Ko`;
}

function ms(value: number | null): string {
  if (value == null) return "n/d";
  return `${Math.round(value)} ms`;
}

function writeJson(dir: string, name: string, data: unknown): void {
  writeFileSync(join(dir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function mirrorLatest(outDir: string, latestDir: string): void {
  mkdirSync(latestDir, { recursive: true });
  for (const name of readdirSync(latestDir)) {
    rmSync(join(latestDir, name), { recursive: true, force: true });
  }
  for (const name of readdirSync(outDir)) {
    copyFileSync(join(outDir, name), join(latestDir, name));
  }
}

function numericAudit(
  audits: Record<string, { numericValue?: number } | undefined>,
  id: string,
): number | null {
  const value = audits[id]?.numericValue;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function resourceBytes(
  audits: Record<
    string,
    {
      details?: {
        items?: Array<{ resourceType?: string; transferSize?: number }>;
      };
    }
  >,
  type: string,
): number | null {
  const items = audits["resource-summary"]?.details?.items;
  if (!items) return null;
  const item = items.find((i) => i.resourceType === type);
  return typeof item?.transferSize === "number" ? item.transferSize : null;
}

function requestCount(
  audits: Record<
    string,
    {
      details?: {
        items?: Array<{ resourceType?: string; requestCount?: number }>;
      };
    }
  >,
): number | null {
  const items = audits["resource-summary"]?.details?.items;
  if (!items) return null;
  const total = items.find((i) => i.resourceType === "total");
  return typeof total?.requestCount === "number" ? total.requestCount : null;
}

function classifyIssues(
  m: Omit<PageMetrics, "mainIssues" | "severity" | "proposedFix">,
): {
  mainIssues: string[];
  severity: PageMetrics["severity"];
  proposedFix: string;
} {
  const issues: string[] = [];
  let severity: PageMetrics["severity"] = "ok";

  if (m.httpStatus != null && m.httpStatus >= 400) {
    issues.push(`HTTP ${m.httpStatus}`);
    severity = "erreur";
  }
  if (m.lcpMs != null && m.lcpMs > BUDGETS.maxLcpMs) {
    issues.push(`LCP élevé (${ms(m.lcpMs)})`);
    severity = severity === "erreur" ? "erreur" : "avertissement";
  }
  if (m.cls != null && m.cls > BUDGETS.maxCls) {
    issues.push(`CLS élevé (${m.cls.toFixed(3)})`);
    severity = m.cls > BUDGETS.blockingCls ? "erreur" : "avertissement";
  }
  if (m.tbtMs != null && m.tbtMs > BUDGETS.maxTbtMs) {
    issues.push(`TBT élevé (${ms(m.tbtMs)})`);
    severity = severity === "erreur" ? "erreur" : "avertissement";
  }
  if (m.imageBytes != null && m.imageBytes > BUDGETS.maxImageKb * 1024) {
    issues.push(`Images lourdes (${kb(m.imageBytes)})`);
    severity =
      m.imageBytes > BUDGETS.blockingImageKb * 1024
        ? "erreur"
        : severity === "erreur"
          ? "erreur"
          : "avertissement";
  }
  if (m.jsBytes != null && m.jsBytes > BUDGETS.maxJsKb * 1024) {
    issues.push(`JS élevé (${kb(m.jsBytes)})`);
    severity = severity === "erreur" ? "erreur" : "avertissement";
  }
  if (m.performanceScore != null && m.performanceScore < BUDGETS.minPerfScore) {
    issues.push(`Score perf faible (${Math.round(m.performanceScore * 100)})`);
    severity = severity === "erreur" ? "erreur" : "avertissement";
  }

  const proposedFix =
    issues.length === 0
      ? "Conserver le niveau actuel ; surveiller les régressions."
      : issues.some((i) => i.includes("Images"))
        ? "Servir WebP/AVIF, dimensions explicites, priority uniquement sur LCP."
        : issues.some((i) => i.includes("LCP"))
          ? "Optimiser l’élément LCP (image/police/SSR) et réduire le JS bloquant."
          : issues.some((i) => i.includes("TBT") || i.includes("JS"))
            ? "Réduire JS client, imports dynamiques, composants serveur par défaut."
            : issues.some((i) => i.includes("CLS"))
              ? "Réserver dimensions images/polices ; éviter insertions tardives."
              : "Investiguer les audits Lighthouse listés dans opportunities.json.";

  return {
    mainIssues: issues.length ? issues : ["Aucun problème majeur détecté"],
    severity,
    proposedFix,
  };
}

async function runLighthouse(
  url: string,
  formFactor: FormFactor,
): Promise<{
  lhr: {
    categories?: { performance?: { score?: number | null } };
    audits?: Record<string, unknown>;
    finalDisplayedUrl?: string;
    runtimeError?: { message?: string };
  };
}> {
  type Lhr = {
    categories?: { performance?: { score?: number | null } };
    audits?: Record<string, unknown>;
    finalDisplayedUrl?: string;
    runtimeError?: { message?: string };
  };

  const chromeLauncher = await import("chrome-launcher");
  const lighthouseMod = (await import("lighthouse")) as unknown as {
    default: (
      targetUrl: string,
      options: Record<string, unknown>,
    ) => Promise<{ lhr: Lhr } | undefined>;
  };
  const lighthouse = lighthouseMod.default;

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    chromePath: process.env.CHROME_PATH || "/usr/bin/chromium-browser",
  });

  try {
    const options = {
      port: chrome.port,
      output: "json" as const,
      logLevel: "error" as const,
      onlyCategories: ["performance"],
      formFactor,
      screenEmulation:
        formFactor === "mobile"
          ? {
              mobile: true,
              width: 412,
              height: 823,
              deviceScaleFactor: 1.75,
              disabled: false,
            }
          : {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
      throttlingMethod: "simulate" as const,
    };

    const result = await lighthouse(url, options);
    if (!result?.lhr) {
      throw new Error(`Lighthouse sans résultat pour ${url} (${formFactor})`);
    }
    return { lhr: result.lhr };
  } finally {
    await chrome.kill();
  }
}

async function probeHttp(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    return res.status;
  } catch {
    return null;
  }
}

function toCsv(pages: PageMetrics[]): string {
  const header = [
    "url",
    "path",
    "formFactor",
    "httpStatus",
    "performanceScore",
    "lcpMs",
    "tbtMs",
    "inpMs",
    "cls",
    "fcpMs",
    "speedIndexMs",
    "totalByteWeight",
    "jsBytes",
    "cssBytes",
    "imageBytes",
    "fontBytes",
    "requestCount",
    "renderBlockingCount",
    "severity",
    "mainIssues",
    "proposedFix",
    "dataKind",
  ];
  const rows = pages.map((p) =>
    [
      p.url,
      p.path,
      p.formFactor,
      p.httpStatus ?? "",
      p.performanceScore ?? "",
      p.lcpMs ?? "",
      p.tbtMs ?? "",
      "",
      p.cls ?? "",
      p.fcpMs ?? "",
      p.speedIndexMs ?? "",
      p.totalByteWeight ?? "",
      p.jsBytes ?? "",
      p.cssBytes ?? "",
      p.imageBytes ?? "",
      p.fontBytes ?? "",
      p.requestCount ?? "",
      p.renderBlockingCount ?? "",
      p.severity,
      `"${p.mainIssues.join("; ").replace(/"/g, '""')}"`,
      `"${p.proposedFix.replace(/"/g, '""')}"`,
      p.dataKind,
    ].join(","),
  );
  return `${header.join(",")}\n${rows.join("\n")}\n`;
}

function loadPreviousBaseline(): PageMetrics[] | null {
  const prevPath = join(ROOT, "data/seo/performance/latest/pages.json");
  if (!existsSync(prevPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(prevPath, "utf8")) as {
      pages?: PageMetrics[];
    };
    return raw.pages ?? null;
  } catch {
    return null;
  }
}

function compareBaselines(
  current: PageMetrics[],
  previous: PageMetrics[] | null,
): {
  regressions: Array<{
    path: string;
    formFactor: FormFactor;
    metric: string;
    before: number | null;
    after: number | null;
    blocking: boolean;
  }>;
} {
  if (!previous) return { regressions: [] };
  const regressions: Array<{
    path: string;
    formFactor: FormFactor;
    metric: string;
    before: number | null;
    after: number | null;
    blocking: boolean;
  }> = [];

  for (const page of current) {
    const prev = previous.find(
      (p) => p.path === page.path && p.formFactor === page.formFactor,
    );
    if (!prev) continue;

    if (
      page.performanceScore != null &&
      prev.performanceScore != null &&
      prev.performanceScore - page.performanceScore >=
        BUDGETS.regressionPerfPoints
    ) {
      regressions.push({
        path: page.path,
        formFactor: page.formFactor,
        metric: "performanceScore",
        before: prev.performanceScore,
        after: page.performanceScore,
        blocking: true,
      });
    }
    if (
      page.lcpMs != null &&
      prev.lcpMs != null &&
      page.lcpMs - prev.lcpMs >= BUDGETS.regressionLcpMs
    ) {
      regressions.push({
        path: page.path,
        formFactor: page.formFactor,
        metric: "lcpMs",
        before: prev.lcpMs,
        after: page.lcpMs,
        blocking: true,
      });
    }
    if (
      page.cls != null &&
      prev.cls != null &&
      page.cls - prev.cls >= BUDGETS.regressionCls
    ) {
      regressions.push({
        path: page.path,
        formFactor: page.formFactor,
        metric: "cls",
        before: prev.cls,
        after: page.cls,
        blocking: true,
      });
    }
  }

  return { regressions };
}

async function main(): Promise<void> {
  const outDir = join(ROOT, "data/seo/performance", EXECUTION_ID);
  mkdirSync(outDir, { recursive: true });

  const pages: PageMetrics[] = [];
  const opportunities: Opportunity[] = [];
  const assets: Array<{
    path: string;
    formFactor: FormFactor;
    jsBytes: number | null;
    cssBytes: number | null;
    imageBytes: number | null;
    fontBytes: number | null;
    totalByteWeight: number | null;
    requestCount: number | null;
    renderBlockingCount: number | null;
  }> = [];

  for (const formFactor of ["mobile", "desktop"] as const) {
    for (const path of PATHS) {
      const url = `${ORIGIN}${path}`;
      console.log(`[${formFactor}] ${url}`);
      const httpStatus = await probeHttp(url);
      const { lhr } = await runLighthouse(url, formFactor);
      const audits = (lhr.audits ?? {}) as Record<
        string,
        {
          numericValue?: number;
          score?: number | null;
          title?: string;
          displayValue?: string;
          details?: {
            items?: Array<{
              resourceType?: string;
              transferSize?: number;
              requestCount?: number;
            }>;
          };
        }
      >;

      const base = {
        url,
        path,
        formFactor,
        httpStatus,
        performanceScore: lhr.categories?.performance?.score ?? null,
        lcpMs: numericAudit(audits, "largest-contentful-paint"),
        tbtMs: numericAudit(audits, "total-blocking-time"),
        inpMs: null as null,
        cls: numericAudit(audits, "cumulative-layout-shift"),
        fcpMs: numericAudit(audits, "first-contentful-paint"),
        speedIndexMs: numericAudit(audits, "speed-index"),
        totalByteWeight: numericAudit(audits, "total-byte-weight"),
        jsBytes: resourceBytes(audits, "script"),
        cssBytes: resourceBytes(audits, "stylesheet"),
        imageBytes: resourceBytes(audits, "image"),
        fontBytes: resourceBytes(audits, "font"),
        requestCount: requestCount(audits),
        renderBlockingCount:
          audits["render-blocking-resources"]?.details?.items?.length ?? null,
        dataKind: "laboratory_lighthouse" as const,
        fieldDataAvailable: false as const,
        fieldDataNote:
          "INP / CWV terrain non disponibles dans cet audit. TBT = indicateur laboratoire uniquement.",
      };

      const classified = classifyIssues(base);
      pages.push({ ...base, ...classified });

      assets.push({
        path,
        formFactor,
        jsBytes: base.jsBytes,
        cssBytes: base.cssBytes,
        imageBytes: base.imageBytes,
        fontBytes: base.fontBytes,
        totalByteWeight: base.totalByteWeight,
        requestCount: base.requestCount,
        renderBlockingCount: base.renderBlockingCount,
      });

      for (const id of [
        "unused-javascript",
        "unused-css-rules",
        "render-blocking-resources",
        "modern-image-formats",
        "uses-responsive-images",
        "offscreen-images",
        "unminified-javascript",
        "unminified-css",
        "uses-text-compression",
        "uses-long-cache-ttl",
        "bootup-time",
        "mainthread-work-breakdown",
        "font-display",
        "cls-culprits-insight",
        "lcp-discovery-insight",
      ]) {
        const audit = audits[id];
        if (!audit) continue;
        const score = typeof audit.score === "number" ? audit.score : null;
        if (score == null || score >= 0.9) continue;
        opportunities.push({
          path,
          formFactor,
          id,
          title: audit.title ?? id,
          score,
          displayValue: audit.displayValue ?? null,
          severity: score < 0.5 ? "erreur" : "avertissement",
        });
      }
    }
  }

  const previous = loadPreviousBaseline();
  const comparison = compareBaselines(pages, previous);
  const isFirstBaseline = previous == null;

  const mobile = pages.filter((p) => p.formFactor === "mobile");
  const desktop = pages.filter((p) => p.formFactor === "desktop");

  const blockingErrors = [
    ...pages.filter((p) => p.severity === "erreur"),
    ...comparison.regressions.filter((r) => r.blocking),
  ];

  writeJson(outDir, "pages.json", {
    executionId: EXECUTION_ID,
    origin: ORIGIN,
    dataKind: "laboratory_lighthouse",
    fieldData: "unavailable",
    budgets: BUDGETS,
    pages,
    comparison: {
      comparedToLatest: !isFirstBaseline,
      regressions: comparison.regressions,
    },
  });
  writeFileSync(join(outDir, "pages.csv"), toCsv(pages), "utf8");
  writeJson(outDir, "mobile.json", {
    executionId: EXECUTION_ID,
    pages: mobile,
  });
  writeJson(outDir, "desktop.json", {
    executionId: EXECUTION_ID,
    pages: desktop,
  });
  writeJson(outDir, "assets.json", { executionId: EXECUTION_ID, assets });
  writeJson(outDir, "opportunities.json", {
    executionId: EXECUTION_ID,
    opportunities,
  });

  const tableRows = PATHS.map((path) => {
    const m = mobile.find((p) => p.path === path);
    const d = desktop.find((p) => p.path === path);
    return `| \`${path}\` | ${m?.performanceScore != null ? Math.round(m.performanceScore * 100) : "n/d"} | ${d?.performanceScore != null ? Math.round(d.performanceScore * 100) : "n/d"} | ${ms(m?.lcpMs ?? null)} / ${ms(d?.lcpMs ?? null)} | ${ms(m?.tbtMs ?? null)} / ${ms(d?.tbtMs ?? null)} | ${m?.cls?.toFixed(3) ?? "n/d"} / ${d?.cls?.toFixed(3) ?? "n/d"} | ${kb(m?.totalByteWeight ?? null)} / ${kb(d?.totalByteWeight ?? null)} | ${(m?.mainIssues ?? []).join("; ")} |`;
  }).join("\n");

  const summary = `# Performance audit (laboratoire) — ${EXECUTION_ID}

**Origine :** ${ORIGIN}
**Nature des données :** Lighthouse laboratoire (simulation). **Pas** des Core Web Vitals utilisateurs réels.
**INP terrain :** non disponible — **TBT** utilisé comme indicateur de lab.
**CrUX / Search Console CWV :** non disponibles dans cet export.

## Budgets (indicatif)

- LCP ≤ ${BUDGETS.maxLcpMs} ms
- CLS ≤ ${BUDGETS.maxCls}
- TBT ≤ ${BUDGETS.maxTbtMs} ms
- Images ≤ ${BUDGETS.maxImageKb} Ko
- JS ≤ ${BUDGETS.maxJsKb} Ko

Les scores Lighthouse ne bloquent **pas** le build pour une variation mineure.

## Tableau par page (mobile / desktop)

| URL | Score mobile | Score desktop | LCP m/d | TBT m/d | CLS m/d | Poids m/d | Problème principal (mobile) |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
${tableRows}

## Régressions vs latest

${
  isFirstBaseline
    ? "_Première baseline — aucune comparaison._"
    : comparison.regressions.length === 0
      ? "_Aucune régression bloquante détectée._"
      : comparison.regressions
          .map(
            (r) =>
              `- \`${r.path}\` (${r.formFactor}) ${r.metric}: ${r.before} → ${r.after}${r.blocking ? " **bloquant**" : ""}`,
          )
          .join("\n")
}

## Erreurs bloquantes

${
  blockingErrors.length === 0
    ? "_Aucune._"
    : `- ${blockingErrors.length} signal(s) — voir pages.json / comparison.`
}
`;

  writeFileSync(join(outDir, "summary.md"), `${summary}\n`, "utf8");
  writeFileSync(
    join(outDir, "README.txt"),
    `Lot SEO 5B — audit performance Lighthouse (laboratoire)
Execution : ${EXECUTION_ID}
Origin    : ${ORIGIN}
Miroir    : data/seo/performance/latest/

Fichiers :
- pages.json / pages.csv
- mobile.json / desktop.json
- assets.json
- opportunities.json
- summary.md

Important :
- Ces chiffres sont des mesures de laboratoire.
- Ils ne remplacent pas les Core Web Vitals terrain (CrUX / Search Console).
- INP réel : non disponible ici ; TBT est un proxy de lab uniquement.
- Aucun secret n’est inclus dans ces exports.

Commandes :
  npm run seo:performance:audit
  npm run seo:performance:production
`,
    "utf8",
  );

  const latestDir = join(ROOT, "data/seo/performance/latest");
  mirrorLatest(outDir, latestDir);

  // Marqueur baseline initiale conservée (ne pas écraser si déjà présent)
  const initialDir = join(ROOT, "data/seo/performance/initial");
  if (!existsSync(join(initialDir, "pages.json"))) {
    mkdirSync(initialDir, { recursive: true });
    for (const name of readdirSync(outDir)) {
      copyFileSync(join(outDir, name), join(initialDir, name));
    }
  }

  console.log(
    `Performance audit écrit dans data/seo/performance/${EXECUTION_ID}/`,
  );

  const hardBlocks = pages.filter(
    (p) =>
      (p.httpStatus != null && p.httpStatus >= 400) ||
      (p.cls != null && p.cls > BUDGETS.blockingCls) ||
      (p.imageBytes != null && p.imageBytes > BUDGETS.blockingImageKb * 1024),
  );
  const blockingRegs = comparison.regressions.filter((r) => r.blocking);

  if (hardBlocks.length > 0 || blockingRegs.length > 0) {
    console.error(
      `Problèmes bloquants: ${hardBlocks.length} pages, ${blockingRegs.length} régressions`,
    );
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { BUDGETS, PATHS };
