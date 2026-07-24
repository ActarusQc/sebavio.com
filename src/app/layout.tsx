import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { buildGoogleSiteVerificationMetadata } from "@/lib/seo/google-site-verification";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const siteUrl = getSiteUrl();

const googleVerification = buildGoogleSiteVerificationMetadata();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sebavia | Copilote intelligent pour planifier vos voyages",
    template: "%s | Sebavia",
  },
  description:
    "Planifiez votre itinéraire, vos arrêts de carburant, vos activités et votre météo avec Sebavia, le copilote intelligent conçu au Québec.",
  applicationName: "Sebavia",
  ...(googleVerification ? { verification: googleVerification } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${poppins.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
