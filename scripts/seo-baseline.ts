/**
 * Lot SEO 5A — Inventaire public + référence SEO (live https://sebavia.com).
 * Usage : npm run seo:baseline
 * Ne simule pas Search Console ; n’envoie aucune demande d’indexation.
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
import { classifyPublicPageType } from "../src/lib/seo/page-type";
import { CANONICAL_SITE_ORIGIN } from "../src/lib/site-url";

const ORIGIN = CANONICAL_SITE_ORIGIN;
const ROOT = join(__dirname, "..");
const EXECUTION_ID = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "Z");

type Severity =
  "conforme" | "avertissement" | "erreur" | "verification_manuelle";

type Finding = {
  severity: Severity;
  code: string;
  message: string;
  url?: string;
};

type SitemapEntry = {
  loc: string;
  lastModified: string | null;
  changeFrequency: string | null;
  priority: string | null;
};

type UrlRecord = {
  url: string;
  path: string;
  pageType: ReturnType<typeof classifyPublicPageType>;
  httpStatus: number | null;
  finalUrl: string | null;
  redirected: boolean;
  redirectChain: string[];
  indexable: boolean | null;
  robots: string | null;
  canonical: string | null;
  title: string | null;
  titleLength: number | null;
  metaDescription: string | null;
  metaDescriptionLength: number | null;
  h1: string | null;
  h1Count: number;
  lang: string | null;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  structuredDataTypes: string[];
  inSitemap: boolean;
  sitemapLastModified: string | null;
  inboundInternalLinks: number;
  outboundInternalLinks: number;
  depthFromHome: number | null;
  inNavigation: boolean;
  inFooter: boolean;
  status: Severity;
  findings: Finding[];
};

const NAV_PATHS = new Set(["/", "/fonctionnalites", "/pricing", "/a-propos"]);

const FOOTER_PATHS = new Set([
  "/",
  "/fonctionnalites",
  "/guides",
  "/a-propos",
  "/pricing",
  "/faq",
  "/contact",
  "/confidentialite",
  "/conditions-utilisation",
]);

const USER_AGENTS = {
  googlebot:
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  googlebotSmartphone:
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  chrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
} as const;

function normalizePath(url: string): string {
  try {
    const u = new URL(url, ORIGIN);
    if (u.origin !== ORIGIN) return url;
    const path = u.pathname.replace(/\/$/, "") || "/";
    return path;
  } catch {
    return url;
  }
}

function absoluteUrl(href: string, base: string): string | null {
  try {
    const u = new URL(href, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function extractAttr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i");
  const m = tag.match(re);
  return m?.[1]?.trim() ?? null;
}

function extractMeta(
  html: string,
  attr: "name" | "property",
  key: string,
): string | null {
  const re = new RegExp(`<meta[^>]+${attr}\\s*=\\s*["']${key}["'][^>]*>`, "gi");
  const tags = html.match(re) ?? [];
  for (const tag of tags) {
    const content = extractAttr(tag, "content");
    if (content != null) return content;
  }
  // content before name/property
  const re2 = new RegExp(
    `<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]+${attr}\\s*=\\s*["']${key}["'][^>]*>`,
    "i",
  );
  const m = html.match(re2);
  return m?.[1]?.trim() ?? null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

function extractH1s(html: string): string[] {
  const matches = html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  return [...matches].map((m) =>
    m[1]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractCanonical(html: string): string | null {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (!/\brel\s*=\s*["']canonical["']/i.test(tag)) continue;
    return extractAttr(tag, "href");
  }
  return null;
}

function extractLang(html: string): string | null {
  const m = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i);
  return m?.[1]?.trim() ?? null;
}

function extractInternalLinks(html: string, pageUrl: string): string[] {
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter(Boolean);
  const out = new Set<string>();
  for (const href of hrefs) {
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }
    const abs = absoluteUrl(href, pageUrl);
    if (!abs) continue;
    try {
      const u = new URL(abs);
      if (u.origin !== ORIGIN) continue;
      // Ignore query-only member deep-links for graph depth of public SEO pages
      const path = u.pathname.replace(/\/$/, "") || "/";
      out.add(`${ORIGIN}${path === "/" ? "" : path}`);
    } catch {
      /* ignore */
    }
  }
  return [...out];
}

function extractJsonLdTypes(html: string): string[] {
  const blocks =
    html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ) ?? [];
  const types = new Set<string>();
  for (const block of blocks) {
    const body = block
      .replace(/^[\s\S]*?>/, "")
      .replace(/<\/script>$/i, "")
      .trim();
    try {
      const data = JSON.parse(body) as unknown;
      const visit = (node: unknown) => {
        if (!node) return;
        if (Array.isArray(node)) {
          node.forEach(visit);
          return;
        }
        if (typeof node !== "object") return;
        const obj = node as Record<string, unknown>;
        const t = obj["@type"];
        if (typeof t === "string") types.add(t);
        if (Array.isArray(t)) {
          for (const item of t) {
            if (typeof item === "string") types.add(item);
          }
        }
        if (obj["@graph"]) visit(obj["@graph"]);
      };
      visit(data);
    } catch {
      types.add("INVALID_JSON_LD");
    }
  }
  return [...types].sort();
}

function extractOpenGraph(html: string): Record<string, string> {
  const keys = [
    "og:title",
    "og:description",
    "og:url",
    "og:type",
    "og:image",
    "og:locale",
    "og:site_name",
  ];
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = extractMeta(html, "property", key);
    if (v) out[key] = v;
  }
  return out;
}

function extractTwitter(html: string): Record<string, string> {
  const keys = [
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ];
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = extractMeta(html, "name", key);
    if (v) out[key] = v;
  }
  return out;
}

function parseRobotsDirective(raw: string | null): {
  index: boolean | null;
  follow: boolean | null;
} {
  if (!raw) return { index: null, follow: null };
  const parts = raw.toLowerCase().split(/,\s*/);
  let index: boolean | null = null;
  let follow: boolean | null = null;
  for (const p of parts) {
    if (p === "index") index = true;
    if (p === "noindex") index = false;
    if (p === "follow") follow = true;
    if (p === "nofollow") follow = false;
  }
  return { index, follow };
}

async function fetchFollow(
  url: string,
  userAgent: string,
  maxRedirects = 5,
): Promise<{
  status: number;
  finalUrl: string;
  redirectChain: string[];
  headers: Headers;
  body: string;
}> {
  const chain: string[] = [];
  let current = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) {
        return {
          status: res.status,
          finalUrl: current,
          redirectChain: chain,
          headers: res.headers,
          body: "",
        };
      }
      chain.push(current);
      current = absoluteUrl(loc, current) ?? loc;
      continue;
    }
    const body = await res.text();
    return {
      status: res.status,
      finalUrl: current,
      redirectChain: chain,
      headers: res.headers,
      body,
    };
  }
  return {
    status: 0,
    finalUrl: current,
    redirectChain: chain,
    headers: new Headers(),
    body: "",
  };
}

function parseSitemapXml(xml: string): SitemapEntry[] {
  const urls: SitemapEntry[] = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/gi) ?? [];
  for (const block of blocks) {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim();
    if (!loc) continue;
    urls.push({
      loc,
      lastModified:
        block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim() ?? null,
      changeFrequency:
        block.match(/<changefreq>([\s\S]*?)<\/changefreq>/i)?.[1]?.trim() ??
        null,
      priority:
        block.match(/<priority>([\s\S]*?)<\/priority>/i)?.[1]?.trim() ?? null,
    });
  }
  return urls;
}

function worstStatus(findings: Finding[]): Severity {
  if (findings.some((f) => f.severity === "erreur")) return "erreur";
  if (findings.some((f) => f.severity === "avertissement"))
    return "avertissement";
  if (findings.some((f) => f.severity === "verification_manuelle")) {
    return "verification_manuelle";
  }
  return "conforme";
}

function toCsv(rows: UrlRecord[]): string {
  const headers = [
    "url",
    "pageType",
    "httpStatus",
    "redirected",
    "indexable",
    "robots",
    "canonical",
    "title",
    "titleLength",
    "metaDescription",
    "metaDescriptionLength",
    "h1",
    "h1Count",
    "lang",
    "inSitemap",
    "sitemapLastModified",
    "inboundInternalLinks",
    "outboundInternalLinks",
    "depthFromHome",
    "inNavigation",
    "inFooter",
    "status",
    "structuredDataTypes",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.url,
        r.pageType,
        r.httpStatus,
        r.redirected,
        r.indexable,
        r.robots,
        r.canonical,
        r.title,
        r.titleLength,
        r.metaDescription,
        r.metaDescriptionLength,
        r.h1,
        r.h1Count,
        r.lang,
        r.inSitemap,
        r.sitemapLastModified,
        r.inboundInternalLinks,
        r.outboundInternalLinks,
        r.depthFromHome,
        r.inNavigation,
        r.inFooter,
        r.status,
        r.structuredDataTypes.join("|"),
      ]
        .map(esc)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function writeJson(dir: string, name: string, data: unknown) {
  writeFileSync(join(dir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function main() {
  const findings: Finding[] = [];
  const outDir = join(ROOT, "data/seo/baseline", EXECUTION_ID);
  const latestDir = join(ROOT, "data/seo/baseline/latest");
  mkdirSync(outDir, { recursive: true });

  // Source de vérité : sitemap applicatif (pas de seconde liste manuelle).
  const sitemapFromCode = sitemap().map((e) => ({
    url: e.url,
    lastModified:
      e.lastModified instanceof Date
        ? e.lastModified.toISOString()
        : e.lastModified
          ? String(e.lastModified)
          : null,
  }));

  const robotsByUa: Record<
    string,
    { status: number; contentType: string | null; body: string }
  > = {};
  for (const [name, ua] of Object.entries(USER_AGENTS)) {
    const res = await fetchFollow(`${ORIGIN}/robots.txt`, ua);
    robotsByUa[name] = {
      status: res.status,
      contentType: res.headers.get("content-type"),
      body: res.body,
    };
  }

  const robotsBody = robotsByUa.chrome.body;
  const robotsAudit = {
    url: `${ORIGIN}/robots.txt`,
    httpStatus: robotsByUa.chrome.status,
    contentType: robotsByUa.chrome.contentType,
    userAgentChecks: Object.fromEntries(
      Object.entries(robotsByUa).map(([k, v]) => [
        k,
        {
          status: v.status,
          contentType: v.contentType,
          bodyMatchesChrome: v.body === robotsBody,
        },
      ]),
    ),
    sitemapReference: /Sitemap:\s*https:\/\/sebavia\.com\/sitemap\.xml/i.test(
      robotsBody,
    ),
    host: /Host:\s*https:\/\/sebavia\.com/i.test(robotsBody),
    allowsRoot: /Allow:\s*\//i.test(robotsBody),
    disallowsPrivate: {
      dashboard: /Disallow:\s*\/dashboard\//i.test(robotsBody),
      admin: /Disallow:\s*\/admin\//i.test(robotsBody),
      api: /Disallow:\s*\/api\//i.test(robotsBody),
    },
    blocksCssOrJs: /Disallow:.*\.(css|js)/i.test(robotsBody),
    mentionsSebavio: /sebavio\.com/i.test(robotsBody),
    body: robotsBody,
    findings: [] as Finding[],
  };

  if (robotsAudit.httpStatus !== 200) {
    robotsAudit.findings.push({
      severity: "erreur",
      code: "ROBOTS_HTTP",
      message: `robots.txt HTTP ${robotsAudit.httpStatus}`,
    });
  }
  if (!robotsAudit.contentType?.includes("text/plain")) {
    robotsAudit.findings.push({
      severity: "avertissement",
      code: "ROBOTS_CONTENT_TYPE",
      message: `Content-Type inattendu: ${robotsAudit.contentType}`,
    });
  }
  if (!robotsAudit.sitemapReference) {
    robotsAudit.findings.push({
      severity: "erreur",
      code: "ROBOTS_SITEMAP",
      message: "Référence Sitemap absente ou incorrecte",
    });
  }
  if (robotsAudit.mentionsSebavio) {
    robotsAudit.findings.push({
      severity: "erreur",
      code: "ROBOTS_OLD_DOMAIN",
      message: "Ancien domaine sebavio.com détecté",
    });
  }
  if (robotsAudit.blocksCssOrJs) {
    robotsAudit.findings.push({
      severity: "erreur",
      code: "ROBOTS_ASSETS",
      message: "Blocage CSS/JS détecté",
    });
  }
  if (!Object.values(robotsAudit.disallowsPrivate).every(Boolean)) {
    robotsAudit.findings.push({
      severity: "avertissement",
      code: "ROBOTS_PRIVATE",
      message: "Disallow privé incomplet",
    });
  }
  for (const [ua, check] of Object.entries(robotsAudit.userAgentChecks)) {
    if (!check.bodyMatchesChrome || check.status !== 200) {
      robotsAudit.findings.push({
        severity: "erreur",
        code: "ROBOTS_UA_DIVERGENCE",
        message: `Réponse robots divergente pour ${ua}`,
      });
    }
  }
  if (robotsAudit.findings.length === 0) {
    robotsAudit.findings.push({
      severity: "conforme",
      code: "ROBOTS_OK",
      message: "robots.txt conforme",
    });
  }
  findings.push(...robotsAudit.findings);

  const sitemapLive = await fetchFollow(
    `${ORIGIN}/sitemap.xml`,
    USER_AGENTS.chrome,
  );
  const sitemapEntries = parseSitemapXml(sitemapLive.body);
  const sitemapLocs = new Set(
    sitemapEntries.map((e) => e.loc.replace(/\/$/, "") || e.loc),
  );
  const codeLocs = new Set(
    sitemapFromCode.map((e) => e.url.replace(/\/$/, "") || e.url),
  );

  const sitemapAudit = {
    url: `${ORIGIN}/sitemap.xml`,
    httpStatus: sitemapLive.status,
    entryCount: sitemapEntries.length,
    codeEntryCount: sitemapFromCode.length,
    entries: [] as Array<
      SitemapEntry & {
        status: Severity;
        findings: Finding[];
        httpStatus?: number;
        redirected?: boolean;
        canonical?: string | null;
        robots?: string | null;
      }
    >,
    missingFromLive: [...codeLocs].filter((u) => !sitemapLocs.has(u)),
    unexpectedInLive: [...sitemapLocs].filter((u) => !codeLocs.has(u)),
    mentionsSebavio: /sebavio\.com/i.test(sitemapLive.body),
    findings: [] as Finding[],
  };

  if (sitemapLive.status !== 200) {
    sitemapAudit.findings.push({
      severity: "erreur",
      code: "SITEMAP_HTTP",
      message: `sitemap.xml HTTP ${sitemapLive.status}`,
    });
  }
  if (sitemapAudit.mentionsSebavio) {
    sitemapAudit.findings.push({
      severity: "erreur",
      code: "SITEMAP_OLD_DOMAIN",
      message: "Ancien domaine sebavio.com dans le sitemap",
    });
  }
  if (
    sitemapAudit.missingFromLive.length ||
    sitemapAudit.unexpectedInLive.length
  ) {
    sitemapAudit.findings.push({
      severity: "erreur",
      code: "SITEMAP_DRIFT",
      message: "Écart entre sitemap code et sitemap live",
    });
  }

  const urlRecords: UrlRecord[] = [];
  const outboundMap = new Map<string, string[]>();
  const inboundCount = new Map<string, number>();

  const allTargets = [
    ...new Set([
      ...sitemapEntries.map((e) => e.loc),
      ...sitemapFromCode.map((e) => e.url),
    ]),
  ];

  for (const target of allTargets) {
    const path = normalizePath(target);
    const pageFindings: Finding[] = [];
    const sitemapMeta = sitemapEntries.find(
      (e) =>
        (e.loc.replace(/\/$/, "") || e.loc) ===
        (target.replace(/\/$/, "") || target),
    );
    const res = await fetchFollow(target, USER_AGENTS.chrome);
    const html = res.body;
    const title = extractTitle(html);
    const description = extractMeta(html, "name", "description");
    const robots = extractMeta(html, "name", "robots");
    const canonical = extractCanonical(html);
    const h1s = extractH1s(html);
    const robotsParsed = parseRobotsDirective(robots);
    const og = extractOpenGraph(html);
    const tw = extractTwitter(html);
    const sdTypes = extractJsonLdTypes(html);
    const internalOut = extractInternalLinks(html, res.finalUrl || target);
    outboundMap.set(target.replace(/\/$/, "") || target, internalOut);

    if (res.status !== 200) {
      pageFindings.push({
        severity: "erreur",
        code: "HTTP_STATUS",
        message: `HTTP ${res.status}`,
        url: target,
      });
    }
    if (res.redirectChain.length > 0) {
      pageFindings.push({
        severity: "erreur",
        code: "REDIRECT",
        message: `Redirection vers ${res.finalUrl}`,
        url: target,
      });
    }
    if (
      canonical &&
      canonical.replace(/\/$/, "") !== target.replace(/\/$/, "")
    ) {
      pageFindings.push({
        severity: "erreur",
        code: "CANONICAL_MISMATCH",
        message: `Canonical ${canonical} ≠ ${target}`,
        url: target,
      });
    }
    if (robotsParsed.index === false) {
      pageFindings.push({
        severity: "erreur",
        code: "NOINDEX",
        message: "Page sitemap en noindex",
        url: target,
      });
    }
    if (!title) {
      pageFindings.push({
        severity: "erreur",
        code: "TITLE_MISSING",
        message: "Title manquant",
        url: target,
      });
    } else if (title.length < 15 || title.length > 70) {
      pageFindings.push({
        severity: "avertissement",
        code: "TITLE_LENGTH",
        message: `Title longueur ${title.length}`,
        url: target,
      });
    }
    if (!description) {
      pageFindings.push({
        severity: "erreur",
        code: "DESC_MISSING",
        message: "Meta description manquante",
        url: target,
      });
    } else if (description.length < 70 || description.length > 170) {
      pageFindings.push({
        severity: "avertissement",
        code: "DESC_LENGTH",
        message: `Description longueur ${description.length}`,
        url: target,
      });
    }
    if (h1s.length !== 1) {
      pageFindings.push({
        severity: h1s.length === 0 ? "erreur" : "avertissement",
        code: "H1_COUNT",
        message: `${h1s.length} H1`,
        url: target,
      });
    }
    if (!og["og:title"] || !og["og:description"] || !og["og:image"]) {
      pageFindings.push({
        severity: "avertissement",
        code: "OG_INCOMPLETE",
        message: "Open Graph incomplet",
        url: target,
      });
    }
    if (!tw["twitter:card"]) {
      pageFindings.push({
        severity: "avertissement",
        code: "TWITTER_INCOMPLETE",
        message: "Twitter card incomplet",
        url: target,
      });
    }
    if (/sebavio\.com/i.test(html)) {
      pageFindings.push({
        severity: "erreur",
        code: "OLD_DOMAIN_HTML",
        message: "Ancien domaine sebavio.com dans le HTML",
        url: target,
      });
    }
    if (/\/login\b|\/dashboard\b|\/admin\b/i.test(path) && sitemapMeta) {
      pageFindings.push({
        severity: "erreur",
        code: "PRIVATE_IN_SITEMAP",
        message: "URL privée/membre dans le sitemap",
        url: target,
      });
    }
    if (new URL(target).search) {
      pageFindings.push({
        severity: "erreur",
        code: "QUERY_IN_SITEMAP",
        message: "Paramètre de requête dans l’URL sitemap",
        url: target,
      });
    }

    const entryFindings = [...pageFindings];
    sitemapAudit.entries.push({
      loc: target,
      lastModified: sitemapMeta?.lastModified ?? null,
      changeFrequency: sitemapMeta?.changeFrequency ?? null,
      priority: sitemapMeta?.priority ?? null,
      httpStatus: res.status,
      redirected: res.redirectChain.length > 0,
      canonical,
      robots,
      status: worstStatus(entryFindings),
      findings: entryFindings,
    });

    urlRecords.push({
      url: target,
      path,
      pageType: classifyPublicPageType(path),
      httpStatus: res.status,
      finalUrl: res.finalUrl,
      redirected: res.redirectChain.length > 0,
      redirectChain: res.redirectChain,
      indexable: robotsParsed.index === null ? true : robotsParsed.index,
      robots,
      canonical,
      title,
      titleLength: title?.length ?? null,
      metaDescription: description,
      metaDescriptionLength: description?.length ?? null,
      h1: h1s[0] ?? null,
      h1Count: h1s.length,
      lang: extractLang(html),
      openGraph: og,
      twitter: tw,
      structuredDataTypes: sdTypes,
      inSitemap: Boolean(sitemapMeta),
      sitemapLastModified: sitemapMeta?.lastModified ?? null,
      inboundInternalLinks: 0,
      outboundInternalLinks: internalOut.length,
      depthFromHome: null,
      inNavigation: NAV_PATHS.has(path),
      inFooter: FOOTER_PATHS.has(path),
      status: worstStatus(pageFindings),
      findings: pageFindings,
    });
    findings.push(...pageFindings);
  }

  // Graphes entrants + profondeur BFS depuis l’accueil
  for (const [, outs] of outboundMap) {
    for (const dest of outs) {
      const key = dest.replace(/\/$/, "") || dest;
      inboundCount.set(key, (inboundCount.get(key) ?? 0) + 1);
    }
  }
  for (const rec of urlRecords) {
    const key = rec.url.replace(/\/$/, "") || rec.url;
    rec.inboundInternalLinks = inboundCount.get(key) ?? 0;
  }

  const homeKey = ORIGIN;
  const depth = new Map<string, number>([
    [homeKey, 0],
    [`${ORIGIN}/`, 0],
  ]);
  const queue = [homeKey];
  while (queue.length) {
    const current = queue.shift()!;
    const currentKey = current.replace(/\/$/, "") || current;
    const outs = outboundMap.get(currentKey) ?? outboundMap.get(current) ?? [];
    const d = depth.get(currentKey) ?? depth.get(current) ?? 0;
    for (const dest of outs) {
      const dk = dest.replace(/\/$/, "") || dest;
      if (depth.has(dk)) continue;
      // Limiter la profondeur au périmètre sitemap public
      if (!allTargets.some((t) => (t.replace(/\/$/, "") || t) === dk)) continue;
      depth.set(dk, d + 1);
      queue.push(dk);
    }
  }
  for (const rec of urlRecords) {
    const key = rec.url.replace(/\/$/, "") || rec.url;
    rec.depthFromHome = depth.has(key) ? (depth.get(key) ?? null) : null;
    if (rec.depthFromHome == null && rec.url !== ORIGIN) {
      rec.findings.push({
        severity: "avertissement",
        code: "UNREACHABLE_FROM_HOME",
        message: "Non atteignable depuis l’accueil via liens internes publics",
        url: rec.url,
      });
      rec.status = worstStatus(rec.findings);
    }
  }

  const orphans = urlRecords
    .filter(
      (r) =>
        r.url.replace(/\/$/, "") !== ORIGIN &&
        r.inboundInternalLinks === 0 &&
        r.inSitemap,
    )
    .map((r) => ({
      url: r.url,
      pageType: r.pageType,
      inNavigation: r.inNavigation,
      inFooter: r.inFooter,
      severity: "avertissement" as const,
      note: "Aucun lien entrant interne détecté depuis les pages inventoriées",
    }));

  const redirects = urlRecords
    .filter((r) => r.redirected)
    .map((r) => ({
      url: r.url,
      finalUrl: r.finalUrl,
      chain: r.redirectChain,
      status: r.httpStatus,
    }));

  const structuredData = urlRecords.map((r) => ({
    url: r.url,
    types: r.structuredDataTypes,
    status: r.structuredDataTypes.includes("INVALID_JSON_LD")
      ? "erreur"
      : r.structuredDataTypes.length === 0
        ? "avertissement"
        : "conforme",
  }));

  // Priorité d’inspection manuelle GSC (pas une preuve d’indexation)
  const priority = [
    ...urlRecords.filter((r) => r.pageType === "home"),
    ...urlRecords.filter((r) => r.pageType === "product"),
    ...urlRecords.filter((r) => r.pageType === "guides_hub"),
    ...urlRecords.filter((r) => r.pageType === "guide"),
    ...urlRecords.filter((r) => r.pageType === "pricing"),
    ...urlRecords.filter((r) => r.pageType === "institutional"),
    ...urlRecords.filter((r) => r.pageType === "legal"),
  ].map((r, index) => ({
    rank: index + 1,
    url: r.url,
    pageType: r.pageType,
    reason:
      r.pageType === "home"
        ? "Page d’entrée — inspection URL + demande d’indexation manuelle unique"
        : r.pageType === "product"
          ? "Page produit commerciale prioritaire"
          : r.pageType === "guide" || r.pageType === "guides_hub"
            ? "Contenu éditorial — surveiller découverte via sitemap"
            : "Page de confiance / conversion",
    gscAction: "inspect_url",
    note: "Ne pas conclure à l’indexation à partir du seul sitemap",
  }));

  const gscVerification = {
    dnsTxtPresent: true,
    dnsMethod: "TXT google-site-verification=… sur apex sebavia.com",
    metaEnvSupport: "GOOGLE_SITE_VERIFICATION → metadata.verification.google",
    metaCurrentlyEmitted: false,
    htmlFilePresent: false,
    oldDomainArtifacts: false,
    status: "verification_manuelle" as Severity,
    note: "DNS déjà en place. Confirmer la propriété dans Search Console (action manuelle). Ne pas supprimer le TXT existant.",
  };

  // Confirmer DNS (sans écrire le jeton dans le dépôt)
  try {
    const { execSync } = await import("node:child_process");
    const txt = execSync("dig +short TXT sebavia.com", {
      encoding: "utf8",
    });
    gscVerification.dnsTxtPresent = /google-site-verification=/i.test(txt);
    if (!gscVerification.dnsTxtPresent) {
      gscVerification.status = "erreur";
      gscVerification.note =
        "TXT google-site-verification introuvable — préparer GOOGLE_SITE_VERIFICATION ou DNS";
    }
  } catch {
    gscVerification.status = "verification_manuelle";
    gscVerification.note =
      "Impossible de relire le DNS ici — vérifier manuellement dans Search Console";
  }

  const counts = {
    conforme: urlRecords.filter((r) => r.status === "conforme").length,
    avertissement: urlRecords.filter((r) => r.status === "avertissement")
      .length,
    erreur: urlRecords.filter((r) => r.status === "erreur").length,
    verification_manuelle: urlRecords.filter(
      (r) => r.status === "verification_manuelle",
    ).length,
  };

  const metadata = {
    executionId: EXECUTION_ID,
    generatedAt: new Date().toISOString(),
    site: ORIGIN,
    commitHint: "lot-seo-5a",
    sourceOfTruth: "src/app/sitemap.ts + crawl live",
    urlCount: urlRecords.length,
    counts,
    gscVerification,
    disclaimer:
      "Présence dans le sitemap ≠ indexation Google. Aucune donnée Search Console simulée.",
  };

  const internalLinks = {
    nodes: urlRecords.map((r) => r.url),
    edges: [...outboundMap.entries()].flatMap(([from, tos]) =>
      tos
        .filter((to) =>
          allTargets.some(
            (t) =>
              (t.replace(/\/$/, "") || t) === (to.replace(/\/$/, "") || to),
          ),
        )
        .map((to) => ({ from, to })),
    ),
  };

  if (sitemapAudit.findings.length === 0) {
    sitemapAudit.findings.push({
      severity: "conforme",
      code: "SITEMAP_OK",
      message: "Sitemap aligné code/live",
    });
  }
  findings.push(...sitemapAudit.findings);

  writeJson(outDir, "urls.json", urlRecords);
  writeFileSync(join(outDir, "urls.csv"), toCsv(urlRecords), "utf8");
  writeJson(outDir, "metadata.json", metadata);
  writeJson(outDir, "internal-links.json", internalLinks);
  writeJson(outDir, "orphan-pages.json", orphans);
  writeJson(outDir, "redirects.json", redirects);
  writeJson(outDir, "structured-data.json", structuredData);
  writeJson(outDir, "sitemap-audit.json", sitemapAudit);
  writeJson(outDir, "robots-audit.json", robotsAudit);
  writeJson(outDir, "priority-indexing-urls.json", priority);
  writeJson(outDir, "gsc-verification.json", gscVerification);

  const summary = `# Référence SEO Sebavia — Lot 5A

**Exécution :** \`${EXECUTION_ID}\`  
**Site :** ${ORIGIN}  
**URL inventoriées :** ${urlRecords.length}

## Statuts

| Statut | Nombre |
| --- | ---: |
| conforme | ${counts.conforme} |
| avertissement | ${counts.avertissement} |
| erreur | ${counts.erreur} |
| vérification manuelle | ${counts.verification_manuelle} |

## robots.txt

- HTTP ${robotsAudit.httpStatus}, Content-Type \`${robotsAudit.contentType}\`
- Sitemap référencé : ${robotsAudit.sitemapReference ? "oui" : "non"}
- UA Googlebot / Smartphone / Chrome : ${
    Object.values(robotsAudit.userAgentChecks).every(
      (c) => c.status === 200 && c.bodyMatchesChrome,
    )
      ? "identique"
      : "divergence"
  }
- Verdict : **${worstStatus(robotsAudit.findings)}**

## sitemap.xml

- HTTP ${sitemapAudit.httpStatus}, ${sitemapAudit.entryCount} entrées
- Aligné avec \`src/app/sitemap.ts\` : ${
    sitemapAudit.missingFromLive.length === 0 &&
    sitemapAudit.unexpectedInLive.length === 0
      ? "oui"
      : "non"
  }
- Ancien domaine sebavio.com : ${sitemapAudit.mentionsSebavio ? "OUI (erreur)" : "non"}
- Verdict : **${worstStatus(sitemapAudit.findings)}**

## Pages orphelines (0 lien entrant interne)

${
  orphans.length === 0
    ? "_Aucune page sitemap sans lien entrant détecté._"
    : orphans.map((o) => `- ${o.url}`).join("\n")
}

## Google Search Console

- Méthode DNS TXT apex : ${gscVerification.dnsTxtPresent ? "détectée" : "absente"}
- Support meta env \`GOOGLE_SITE_VERIFICATION\` : prêt (émis seulement si variable définie)
- **Action manuelle requise** : ouvrir Search Console, confirmer la propriété \`sebavia.com\`, soumettre le sitemap, inspecter les URL prioritaires (voir \`priority-indexing-urls.json\` et la doc lot 5A).

## Avertissements importants

- Une URL dans le sitemap n’est **pas** une preuve d’indexation.
- Aucune demande d’indexation automatique répétitive n’a été envoyée.
- Aucune donnée Search Console n’a été simulée.

## Fichiers

Voir \`README.txt\` dans ce dossier.
`;

  writeFileSync(join(outDir, "summary.md"), `${summary}\n`, "utf8");
  writeFileSync(
    join(outDir, "README.txt"),
    `Référence SEO Sebavia — Lot 5A
================================

Dossier : data/seo/baseline/${EXECUTION_ID}/
Miroir  : data/seo/baseline/latest/

Fichiers
--------
urls.json                     Inventaire détaillé des URL publiques
urls.csv                      Export tableur
metadata.json                 Métadonnées d’exécution + GSC
internal-links.json           Graphe de liens internes (périmètre public)
orphan-pages.json             Pages sitemap sans lien entrant
redirects.json                Redirections détectées
structured-data.json          Types JSON-LD par URL
sitemap-audit.json            Audit sitemap live vs code
robots-audit.json             Audit robots.txt (multi UA)
priority-indexing-urls.json   Liste d’inspection manuelle GSC
gsc-verification.json         État préparation Search Console
summary.md                    Synthèse humaine
README.txt                    Ce fichier

Légende des statuts
-------------------
conforme               Contrôle automatique OK
avertissement          À surveiller / corriger si pertinent
erreur                 Anomalie à corriger
verification_manuelle  Action humaine requise (Search Console)

Sécurité
--------
Aucun secret, aucune clé API, aucun mot de passe Google.
Le jeton DNS de vérification n’est pas recopié ici.

Régénération
------------
npm run seo:baseline
`,
    "utf8",
  );

  // latest/
  mkdirSync(latestDir, { recursive: true });
  for (const name of readdirSync(latestDir)) {
    rmSync(join(latestDir, name), { recursive: true, force: true });
  }
  for (const name of readdirSync(outDir)) {
    copyFileSync(join(outDir, name), join(latestDir, name));
  }

  // pointer
  writeFileSync(
    join(ROOT, "data/seo/baseline/LATEST_ID.txt"),
    `${EXECUTION_ID}\n`,
    "utf8",
  );

  console.log(`Baseline SEO écrite → data/seo/baseline/${EXECUTION_ID}/`);
  console.log(
    `Statuts: conforme=${counts.conforme} avertissement=${counts.avertissement} erreur=${counts.erreur}`,
  );
  console.log(`Orphelines: ${orphans.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
