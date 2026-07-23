import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";
import { getSiteUrl, NOINDEX_FOLLOW_ROBOTS } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre compte Sebavia pour accéder à vos voyages.",
  alternates: {
    canonical: `${siteUrl}/login`,
  },
  robots: NOINDEX_FOLLOW_ROBOTS,
};

export default function LoginPage() {
  return (
    <section className="w-full">
      <header className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0E2D46] dark:text-[#0E2D46]">
          Connexion à votre compte
        </h1>
        <p className="mt-2 text-sm text-[#5f7076] dark:text-[#5f7076]">
          Accédez à tous vos voyages.
        </p>
      </header>
      <LoginForm />
    </section>
  );
}
