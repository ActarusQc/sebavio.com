import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "@/features/auth";
import { getSiteUrl, NOINDEX_FOLLOW_ROBOTS } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Vérification du courriel",
  description: "Confirmez l’adresse courriel de votre compte Sebavia.",
  alternates: {
    canonical: `${siteUrl}/verify-email`,
  },
  robots: NOINDEX_FOLLOW_ROBOTS,
};

type Props = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = params.email ?? "";
  const token = params.token ?? "";

  if (!email || !token) {
    return (
      <p className="text-destructive text-center text-sm">
        Lien de vérification invalide ou incomplet.
      </p>
    );
  }

  const result = await verifyEmailAction(email, token);

  return (
    <section className="w-full text-center">
      <h1 className="font-heading mb-4 text-2xl font-semibold tracking-tight text-[#0E2D46] dark:text-[#0E2D46]">
        Vérification du courriel
      </h1>
      <p
        className={
          result.ok ? "text-sm text-emerald-700" : "text-destructive text-sm"
        }
      >
        {result.message}
      </p>
      <p className="mt-6 text-sm">
        <Link
          href="/login"
          className="text-[#4E7F85] underline-offset-4 hover:underline dark:text-[#4E7F85]"
        >
          Se connecter
        </Link>
      </p>
    </section>
  );
}
