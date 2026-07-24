/**
 * Lot SEO 5B — Préparation Bing Webmaster Tools (lecture seule).
 * Usage : npm run seo:bing:readiness
 * Ne crée aucun compte Microsoft/Google ; ne stocke aucune autorisation.
 */
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import sitemap from "../src/app/sitemap";
import { CANONICAL_SITE_ORIGIN } from "../src/lib/site-url";

const ORIGIN = CANONICAL_SITE_ORIGIN;
const ROOT = join(__dirname, "..");
const EXECUTION_ID = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "Z");

const BINGBOT_UA =
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";

const SAMPLE_PATHS = [
  "/",
  "/fonctionnalites",
  "/pricing",
  "/assistant-voyage-ia",
  "/planificateur-road-trip-quebec",
  "/guides",
  "/guides/road-trip-nature-quebec",
  "/register",
] as const;

type UrlCheck = {
  url: string;
  path: string;
  httpStatus: number | null;
  finalUrl: string | null;
  ok: boolean;
  containsSebavioDomain: boolean;
  error: string | null;
};

async function fetchText(
  url: string,
  userAgent: string,
): Promise<{
  status: number;
  finalUrl: string;
  body: string;
  headers: Record<string, string>;
}> {
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent },
    redirect: "follow",
  });
  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const body = await res.text();
  return { status: res.status, finalUrl: res.url, body, headers };
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

async function main(): Promise<void> {
  const outDir = join(ROOT, "data/seo/bing-readiness", EXECUTION_ID);
  const latestDir = join(ROOT, "data/seo/bing-readiness/latest");
  mkdirSync(outDir, { recursive: true });

  const robots = await fetchText(`${ORIGIN}/robots.txt`, BINGBOT_UA);
  const sitemapRes = await fetchText(`${ORIGIN}/sitemap.xml`, BINGBOT_UA);

  const robotsAllowsBing =
    robots.status === 200 &&
    !/user-agent:\s*bingbot[\s\S]*?disallow:\s*\//i.test(robots.body) &&
    /allow:\s*\//i.test(robots.body);

  const sitemapOk =
    sitemapRes.status === 200 &&
    /<urlset|<sitemapindex/i.test(sitemapRes.body) &&
    sitemapRes.body.includes(ORIGIN);

  const sitemapContainsSebavio = /sebavio\.com/i.test(sitemapRes.body);
  const robotsContainsSebavio = /sebavio\.com/i.test(robots.body);

  const expectedLocs = new Set(sitemap().map((e) => e.url));
  const locMatches = [...sitemapRes.body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(
    (m) => m[1].trim(),
  );

  const urls: UrlCheck[] = [];
  for (const path of SAMPLE_PATHS) {
    const url = `${ORIGIN}${path}`;
    try {
      const res = await fetchText(url, BINGBOT_UA);
      const containsSebavioDomain = /sebavio\.com/i.test(res.body);
      urls.push({
        url,
        path,
        httpStatus: res.status,
        finalUrl: res.finalUrl,
        ok: res.status === 200,
        containsSebavioDomain,
        error: null,
      });
    } catch (error) {
      urls.push({
        url,
        path,
        httpStatus: null,
        finalUrl: null,
        ok: false,
        containsSebavioDomain: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const allUrlsOk = urls.every((u) => u.ok);
  const noPublicSebavio =
    !sitemapContainsSebavio &&
    !robotsContainsSebavio &&
    urls.every((u) => !u.containsSebavioDomain);

  writeJson(outDir, "robots.json", {
    executionId: EXECUTION_ID,
    dataKind: "laboratory_http",
    note: "Lecture HTTP avec User-Agent Bingbot — pas une donnée réelle Bing Webmaster.",
    url: `${ORIGIN}/robots.txt`,
    httpStatus: robots.status,
    finalUrl: robots.finalUrl,
    allowsBingbot: robotsAllowsBing,
    containsSebavioDomain: robotsContainsSebavio,
    bodyPreview: robots.body.slice(0, 2000),
  });

  writeJson(outDir, "sitemap.json", {
    executionId: EXECUTION_ID,
    dataKind: "laboratory_http",
    url: `${ORIGIN}/sitemap.xml`,
    httpStatus: sitemapRes.status,
    finalUrl: sitemapRes.finalUrl,
    ok: sitemapOk,
    containsSebavioDomain: sitemapContainsSebavio,
    locCount: locMatches.length,
    expectedPublicCount: expectedLocs.size,
    missingFromLive: [...expectedLocs].filter((u) => !locMatches.includes(u)),
    unexpectedLive: locMatches.filter((u) => !expectedLocs.has(u)),
  });

  writeJson(outDir, "urls.json", {
    executionId: EXECUTION_ID,
    dataKind: "laboratory_http",
    userAgent: BINGBOT_UA,
    urls,
  });

  const blocking: string[] = [];
  if (!robotsAllowsBing)
    blocking.push("robots.txt inaccessible ou bloquant Bingbot");
  if (!sitemapOk)
    blocking.push("sitemap.xml inaccessible ou invalide pour Bingbot");
  if (!allUrlsOk)
    blocking.push("au moins une page publique ne renvoie pas HTTP 200");
  if (!noPublicSebavio)
    blocking.push("domaine historique sebavio.com exposé publiquement");

  const summary = `# Bing readiness — ${EXECUTION_ID}

**Site :** ${ORIGIN}
**Données :** laboratoire HTTP (User-Agent Bingbot) — **pas** des données Bing Webmaster Tools réelles.

## Résultat

| Contrôle | État |
| --- | --- |
| robots.txt lisible par Bingbot | ${robotsAllowsBing ? "OK" : "ÉCHEC"} (${robots.status}) |
| sitemap.xml lisible | ${sitemapOk ? "OK" : "ÉCHEC"} (${sitemapRes.status}) |
| Pages échantillon HTTP 200 | ${allUrlsOk ? "OK" : "ÉCHEC"} (${urls.filter((u) => u.ok).length}/${urls.length}) |
| Aucun sebavio.com public | ${noPublicSebavio ? "OK" : "ÉCHEC"} |
| Blocage spécifique Bingbot | ${robotsAllowsBing ? "Aucun détecté" : "Possible"} |

## Action manuelle restante

1. Ouvrir Bing Webmaster Tools (compte Microsoft propriétaire).
2. Importer la propriété depuis Google Search Console (\`sebavia.com\`).
3. Vérifier que \`https://sebavia.com/sitemap.xml\` apparaît.
4. Suivre \`docs/seo/bing-webmaster-tools.md\`.

Aucune autorisation Microsoft/Google n’est stockée dans ce dépôt.
${blocking.length ? `\n## Problèmes\n\n${blocking.map((b) => `- ${b}`).join("\n")}\n` : ""}
`;

  writeFileSync(join(outDir, "summary.md"), `${summary}\n`, "utf8");
  mirrorLatest(outDir, latestDir);

  console.log(
    `Bing readiness écrit dans data/seo/bing-readiness/${EXECUTION_ID}/`,
  );
  if (blocking.length > 0) {
    console.error(blocking.join("\n"));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
