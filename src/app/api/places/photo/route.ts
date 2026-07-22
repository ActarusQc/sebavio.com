import { NextResponse } from "next/server";
import { requireActiveUser } from "@/features/auth/services/session";
import { handleRouteError } from "@/features/auth/services/http";

export const runtime = "nodejs";

/**
 * Proxy authentifié vers Places Photo Media (évite d’exposer la clé côté client).
 * GET /api/places/photo?name=places%2F...%2Fphotos%2F...&maxWidthPx=320
 */
export async function GET(request: Request) {
  try {
    await requireActiveUser();

    const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Photos Places non configurées" },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")?.trim() ?? "";
    const maxWidthPx = Math.min(
      1200,
      Math.max(64, Number(searchParams.get("maxWidthPx") ?? "320") || 320),
    );

    if (
      !name ||
      !name.startsWith("places/") ||
      !name.includes("/photos/") ||
      name.includes("..") ||
      name.length > 500
    ) {
      return NextResponse.json(
        { error: "Référence photo invalide" },
        { status: 400 },
      );
    }

    const upstream = new URL(`https://places.googleapis.com/v1/${name}/media`);
    upstream.searchParams.set("maxWidthPx", String(maxWidthPx));
    upstream.searchParams.set("skipHttpRedirect", "false");

    const res = await fetch(upstream, {
      method: "GET",
      headers: { "X-Goog-Api-Key": apiKey },
      next: { revalidate: 86_400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Photo indisponible" },
        { status: res.status === 404 ? 404 : 502 },
      );
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
