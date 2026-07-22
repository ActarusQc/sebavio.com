import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { MountainRoadIllustration } from "./mountain-road-illustration";

type DashboardHeroProps = {
  firstName: string | null;
};

export function DashboardHero({ firstName }: DashboardHeroProps) {
  const greeting = firstName?.trim()
    ? `Bonjour ${firstName.trim()}!`
    : "Bonjour !";

  return (
    <section className="border-client-border from-sebavio-navy to-sebavio-slate relative min-h-[9.5rem] overflow-hidden rounded-[var(--client-radius)] border via-[#123a52] shadow-[var(--client-shadow)] sm:min-h-[11rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgb(240_182_77/0.22),transparent_45%)]"
      />
      <div className="relative z-10 flex h-full min-h-[9.5rem] flex-col justify-center gap-4 p-6 sm:min-h-[11rem] sm:flex-row sm:items-center sm:justify-between sm:p-8 lg:p-9">
        <div className="max-w-xl space-y-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-[2.125rem] sm:leading-tight">
            {greeting}{" "}
            <span aria-hidden className="inline-block">
              👋
            </span>
          </h1>
          <p className="text-base text-white/85 sm:text-lg">
            Prêt pour votre prochaine aventure&nbsp;?
          </p>
          <Button
            size="lg"
            className="text-sebavio-navy h-11 gap-2 border-0 bg-gradient-to-r from-[#f0b64d] to-[#e8923a] shadow-sm hover:brightness-[0.97]"
            render={<Link href="/dashboard/ai" />}
          >
            Créer un voyage
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] opacity-90 md:block"
          aria-hidden
        >
          <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#123a52] to-transparent" />
          <MountainRoadIllustration className="h-full w-full scale-110 object-cover object-left opacity-80" />
        </div>
      </div>
    </section>
  );
}
