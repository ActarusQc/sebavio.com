import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth";
import { getSiteUrl, NOINDEX_FOLLOW_ROBOTS } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description:
    "Réinitialisez le mot de passe de votre compte Sebavia en toute sécurité.",
  alternates: {
    canonical: `${siteUrl}/forgot-password`,
  },
  robots: NOINDEX_FOLLOW_ROBOTS,
};

export default function ForgotPasswordPage() {
  return (
    <section className="w-full">
      <header className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0E2D46] dark:text-[#0E2D46]">
          Mot de passe oublié
        </h1>
        <p className="mt-2 text-sm text-[#5f7076] dark:text-[#5f7076]">
          Recevez un lien pour réinitialiser votre mot de passe.
        </p>
      </header>
      <ForgotPasswordForm />
    </section>
  );
}
