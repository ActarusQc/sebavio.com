import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AiPlannerCard() {
  return (
    <section
      aria-labelledby="ai-planner-heading"
      className="relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/12 bg-[linear-gradient(145deg,#0a1628_0%,#122044_45%,#1a1540_100%)] p-6 shadow-[0_8px_32px_rgb(0_0_0/0.35)] sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(139,92,246,0.35),transparent_42%),radial-gradient(circle_at_15%_80%,rgba(59,130,246,0.22),transparent_45%)]"
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-40"
        viewBox="0 0 400 90"
        preserveAspectRatio="none"
      >
        <path
          d="M0 70 Q80 30 160 50 T320 35 L400 55 L400 90 L0 90 Z"
          fill="rgba(59,130,246,0.2)"
        />
        <path
          d="M0 75 Q100 45 200 60 T400 45"
          fill="none"
          stroke="rgba(240,182,77,0.55)"
          strokeWidth="2"
        />
        <circle cx="340" cy="22" r="2.5" fill="#f0b64d" />
        <circle cx="60" cy="18" r="1.5" fill="#fff" opacity="0.7" />
      </svg>
      <div className="relative z-10 flex flex-1 flex-col gap-5">
        <div className="flex items-center gap-1.5 text-[#f0b64d]" aria-hidden>
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
          <p className="max-w-sm text-[0.9375rem] leading-relaxed text-white/70">
            Décrivez votre prochain voyage et Sebavio vous aide à bâtir un
            itinéraire adapté à vos envies, à votre véhicule et à votre façon de
            voyager.
          </p>
        </div>
        <Link
          href="/dashboard/ai"
          className="font-heading mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-5 text-[0.95rem] font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)] transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none sm:w-auto"
        >
          <Sparkles className="size-4" aria-hidden />
          Planifier avec Sebavio
        </Link>
      </div>
    </section>
  );
}
