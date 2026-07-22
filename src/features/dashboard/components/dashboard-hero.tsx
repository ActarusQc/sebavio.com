import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BRAND_ASSETS } from "@/features/marketing";

type DashboardHeroProps = {
  firstName: string | null;
  continueTripHref?: string | null;
};

export function DashboardHero({
  firstName,
  continueTripHref = null,
}: DashboardHeroProps) {
  const greeting = firstName?.trim()
    ? `Bonjour ${firstName.trim()}!`
    : "Bonjour !";

  return (
    <section className="relative isolate min-h-[14rem] overflow-hidden rounded-[1.25rem] border border-white/10 shadow-[0_12px_40px_rgb(0_0_0/0.35)] sm:min-h-[16rem] lg:min-h-[17.5rem]">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <Image
          src={BRAND_ASSETS.heroLandscape}
          alt=""
          fill
          priority
          className="object-cover object-[70%_55%]"
          sizes="(max-width: 1280px) 100vw, 1200px"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 50% 70% at 18% 45%, rgba(59,130,246,0.22), transparent 60%),
              radial-gradient(ellipse 40% 50% at 85% 30%, rgba(139,92,246,0.18), transparent 55%),
              linear-gradient(90deg, rgba(5,11,28,0.92) 0%, rgba(5,11,28,0.78) 38%, rgba(5,11,28,0.45) 62%, rgba(5,11,28,0.55) 100%),
              linear-gradient(180deg, rgba(5,11,28,0.35) 0%, transparent 40%, rgba(5,11,28,0.55) 100%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 flex h-full min-h-[14rem] flex-col justify-center gap-5 p-6 sm:min-h-[16rem] sm:p-8 lg:min-h-[17.5rem] lg:p-10">
        <div className="max-w-xl space-y-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl sm:leading-tight">
            {greeting}{" "}
            <span aria-hidden className="inline-block">
              👋
            </span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            Prêt pour votre prochaine aventure&nbsp;?
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/ai"
              className="font-heading inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-6 text-[0.95rem] font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)] transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none"
            >
              Créer un voyage
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            {continueTripHref ? (
              <Link
                href={continueTripHref}
                className="font-heading inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 text-[0.95rem] font-semibold text-white transition-colors hover:border-white/70 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
              >
                Continuer mon voyage
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
