import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function AiPlannerCard() {
  return (
    <section
      aria-labelledby="ai-planner-heading"
      className="from-sebavio-navy to-sebavio-slate relative flex h-full flex-col overflow-hidden rounded-[var(--client-radius)] bg-gradient-to-br via-[#0f3550] p-6 shadow-[var(--client-shadow)] sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgb(240_182_77/0.28),transparent_40%)]"
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-30"
        viewBox="0 0 400 80"
        preserveAspectRatio="none"
      >
        <path
          d="M0 60 Q80 20 160 45 T320 30 L400 50 L400 80 L0 80 Z"
          fill="rgb(240 182 77 / 0.25)"
        />
        <path
          d="M0 65 Q100 40 200 55 T400 40"
          fill="none"
          stroke="rgb(240 182 77 / 0.55)"
          strokeWidth="2"
        />
      </svg>
      <div className="relative z-10 flex flex-1 flex-col gap-5">
        <div
          className="text-sebavio-gold flex items-center gap-1.5"
          aria-hidden
        >
          <Sparkles className="size-5" />
          <Sparkles className="size-3.5 opacity-70" />
          <Sparkles className="size-4 opacity-85" />
        </div>
        <div className="space-y-2.5">
          <h2
            id="ai-planner-heading"
            className="font-heading text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]"
          >
            Votre copilote est prêt
          </h2>
          <p className="max-w-sm text-[0.9375rem] leading-relaxed text-white/80">
            Décrivez votre prochain voyage et Sebavio vous aidera à construire
            un itinéraire adapté à vos envies, à votre véhicule et à votre façon
            de voyager.
          </p>
        </div>
        <Button
          className="text-sebavio-navy mt-auto h-11 w-full gap-2 border-0 bg-gradient-to-r from-[#f0b64d] to-[#e8923a] shadow-sm hover:brightness-[0.97] sm:w-auto"
          size="lg"
          render={<Link href="/dashboard/ai" />}
        >
          <Sparkles className="size-4" aria-hidden />
          Planifier avec Sebavio
        </Button>
      </div>
    </section>
  );
}
