import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { AppError } from "@/lib/errors";
import {
  ALLOWED_DOWNLOAD_HOSTS,
  USER_AGENT,
  getVehicleCatalogEnv,
} from "./config";

function assertAllowedUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError("EXT_001", "URL catalogue invalide", 400);
  }
  if (url.protocol !== "https:") {
    throw new AppError("EXT_001", "Seules les URL HTTPS sont autorisées", 400);
  }
  const host = url.hostname.toLowerCase();
  if (!ALLOWED_DOWNLOAD_HOSTS.has(host)) {
    throw new AppError(
      "EXT_001",
      `Domaine non autorisé pour le catalogue: ${host}`,
      400,
    );
  }
  // Bloquer IP littérales / localhost
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.includes(":")
  ) {
    throw new AppError("EXT_001", "Hôte interdit", 400);
  }
  return url;
}

async function fetchWithLimits(
  rawUrl: string,
  init?: RequestInit,
): Promise<Response> {
  const env = getVehicleCatalogEnv();
  let current = assertAllowedUrl(rawUrl);
  let redirects = 0;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.httpTimeoutMs);
    try {
      const response = await fetch(current.toString(), {
        ...init,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "application/json,text/csv,*/*",
          "User-Agent": USER_AGENT,
          ...(init?.headers ?? {}),
        },
      });

      if (
        [301, 302, 303, 307, 308].includes(response.status) &&
        response.headers.get("location")
      ) {
        redirects += 1;
        if (redirects > env.maxRedirects) {
          throw new AppError("EXT_002", "Trop de redirections HTTP", 502);
        }
        const next = new URL(
          response.headers.get("location")!,
          current,
        ).toString();
        current = assertAllowedUrl(next);
        continue;
      }

      return response;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("EXT_002", "Délai HTTP catalogue dépassé", 504);
      }
      throw new AppError(
        "EXT_002",
        "Échec réseau lors de l'accès au catalogue officiel",
        502,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

export async function fetchOfficialJson<T>(url: string): Promise<T> {
  const response = await fetchWithLimits(url);
  if (!response.ok) {
    throw new AppError(
      "EXT_002",
      `API catalogue officielle indisponible (${response.status})`,
      502,
    );
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (
    !contentType.includes("json") &&
    !contentType.includes("javascript") &&
    !contentType.includes("text/plain")
  ) {
    // CKAN renvoie parfois application/json sans charset — tolérer body JSON parseable
  }
  return (await response.json()) as T;
}

export type DownloadedFile = {
  filePath: string;
  contentType: string | null;
  bytes: number;
  finalUrl: string;
};

export async function downloadOfficialFile(
  url: string,
  filenameHint: string,
): Promise<DownloadedFile> {
  const env = getVehicleCatalogEnv();
  const maxBytes = env.maxFileSizeMb * 1024 * 1024;
  const response = await fetchWithLimits(url);
  if (!response.ok || !response.body) {
    throw new AppError(
      "EXT_002",
      `Téléchargement catalogue échoué (${response.status})`,
      502,
    );
  }

  const contentType = response.headers.get("content-type");
  const contentLength = Number(response.headers.get("content-length") ?? NaN);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new AppError(
      "EXT_003",
      `Fichier catalogue trop volumineux (max ${env.maxFileSizeMb} Mo)`,
      413,
    );
  }

  const dir = path.join(tmpdir(), "sebavio-vehicle-catalog");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const safeName = filenameHint.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  const filePath = path.join(dir, `${Date.now()}-${safeName}`);

  const nodeStream = Readable.fromWeb(
    response.body as import("stream/web").ReadableStream,
  );
  let bytes = 0;
  nodeStream.on("data", (chunk: Buffer) => {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      nodeStream.destroy(
        new AppError(
          "EXT_003",
          `Fichier catalogue trop volumineux (max ${env.maxFileSizeMb} Mo)`,
          413,
        ),
      );
    }
  });

  try {
    await pipeline(nodeStream, createWriteStream(filePath, { mode: 0o600 }));
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    if (error instanceof AppError) throw error;
    throw new AppError("EXT_002", "Échec écriture fichier temporaire", 502);
  }

  return {
    filePath,
    contentType,
    bytes,
    finalUrl: url,
  };
}

export async function safeUnlink(filePath: string | null | undefined) {
  if (!filePath) return;
  await unlink(filePath).catch(() => undefined);
}
