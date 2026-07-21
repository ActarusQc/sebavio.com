import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter, SiteHeader, BRAND_ASSETS } from "@/features/marketing";
import { PricingPlansGrid } from "@/features/subscriptions/components/pricing-plans-grid";
import { listPublicOfficialPlans } from "@/features/subscriptions/services/public-plans";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Tarifs — Sebavio",
  description:
    "Découverte gratuite, Pass 30 jours sans abonnement, ou Sebavio Plus annuel.",
};

export default async function PricingPage() {
  const [session, plans] = await Promise.all([
    auth(),
    listPublicOfficialPlans().catch(() => []),
  ]);

  const cards = plans.map((plan) => {
    const price = plan.currentPrices[0] ?? null;
    return {
      slug: plan.internalName,
      publicName: plan.publicName,
      shortDescription: plan.shortDescription,
      unitAmountCents: price?.unitAmount ?? null,
      currency: price?.currency ?? "cad",
    };
  });

  return (
    <div className="bg-sebavio-background flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(240,182,77,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(45,90,90,0.12),_transparent_50%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-[90rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                <Image
                  src={BRAND_ASSETS.sparkle}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7"
                  aria-hidden
                />
                <p className="text-sebavio-gold text-xs font-semibold tracking-wide uppercase">
                  L’étoile qui guide votre route
                </p>
              </div>
              <h1 className="font-heading text-sebavio-navy text-3xl font-bold tracking-tight sm:text-4xl">
                Des tarifs simples pour chaque voyage
              </h1>
              <p className="text-sebavio-muted mt-3 text-base leading-relaxed sm:text-lg">
                Commencez gratuitement, débloquez un Pass pour vos vacances, ou
                choisissez Plus pour toute l’année — sans surprise.
              </p>
            </div>

            <PricingPlansGrid
              plans={cards}
              isAuthenticated={Boolean(session?.user?.id)}
            />

            <p className="text-sebavio-muted mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed">
              Le Pass 30 jours est un paiement unique, sans frais mensuels. Les
              accès payants sont confirmés après le paiement (webhook Stripe) —
              le retour navigateur n’active pas l’abonnement.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
