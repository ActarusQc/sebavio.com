import type { Metadata } from "next";
import { BRAND_ASSETS } from "./brand-assets";
import { getSiteUrl } from "@/lib/site-url";

type BuildTrustPageMetadataInput = {
  path: `/${string}`;
  title: string;
  description: string;
};

export function buildTrustPageMetadata({
  path,
  title,
  description,
}: BuildTrustPageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fr_CA",
      url,
      siteName: "Sebavia",
      title,
      description,
      images: [
        {
          url: BRAND_ASSETS.heroLandscape,
          width: 1200,
          height: 630,
          alt: "Sebavia — copilote intelligent de voyage",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [BRAND_ASSETS.heroLandscape],
    },
    robots: { index: true, follow: true },
  };
}
