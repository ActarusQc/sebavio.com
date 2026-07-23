import Image from "next/image";
import Link from "next/link";
import { Mic, MessageSquareText } from "lucide-react";
import { FadeIn } from "@/components/common";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { PRICING_PAGE } from "../lib/pricing-content";

type PricingAgentSectionProps = {
  voiceIncluded: boolean;
};

export function PricingAgentSection({
  voiceIncluded,
}: PricingAgentSectionProps) {
  const { agent } = PRICING_PAGE;

  return (
    <section
      className="bg-white py-12 sm:py-16"
      aria-labelledby="pricing-agent-heading"
    >
      <div className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 lg:px-10">
        <FadeIn>
          <p className="text-[0.8rem] font-semibold tracking-wide text-[#3b82f6] uppercase">
            Agent Sebavia
          </p>
          <h2
            id="pricing-agent-heading"
            className="font-heading mt-1 text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2.1rem]"
          >
            {agent.title}
          </h2>
          <p className="mt-3 max-w-xl text-[1.02rem] leading-relaxed text-[#60758a]">
            {agent.body}
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#dfe7ef] bg-[#f7f9fc] p-4">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(139,92,246,0.18))] text-[#3b82f6]">
                <MessageSquareText className="size-4" aria-hidden />
              </span>
              <h3 className="font-heading mt-3 text-base font-semibold text-[#082b46]">
                {agent.textTitle}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#60758a]">
                {agent.textBody}
              </p>
            </div>
            <div className="rounded-2xl border border-[#dfe7ef] bg-[#f7f9fc] p-4">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(139,92,246,0.18))] text-[#8b5cf6]">
                <Mic className="size-4" aria-hidden />
              </span>
              <h3 className="font-heading mt-3 text-base font-semibold text-[#082b46]">
                {agent.voiceTitle}
                {voiceIncluded ? (
                  <span className="sr-only">
                    {" "}
                    (incluse dans les forfaits payants)
                  </span>
                ) : null}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#60758a]">
                {agent.voiceBody}
              </p>
            </div>
          </div>
          <p className="mt-5 text-xs text-[#60758a]/80">{agent.footnote}</p>
          <p className="mt-4 text-sm text-[#60758a]">
            En savoir plus :{" "}
            <Link
              href="/assistant-voyage-ia"
              className="font-medium text-[#3b6f9c] hover:underline"
            >
              Assistant voyage IA
            </Link>
            {" · "}
            <Link
              href="/planificateur-road-trip-quebec"
              className="font-medium text-[#3b6f9c] hover:underline"
            >
              Planificateur de road trip au Québec
            </Link>
            {" · "}
            <Link
              href="/calculateur-cout-carburant-voyage"
              className="font-medium text-[#3b6f9c] hover:underline"
            >
              Coût de carburant
            </Link>
            {" · "}
            <Link
              href="/fonctionnalites"
              className="font-medium text-[#3b6f9c] hover:underline"
            >
              Fonctionnalités
            </Link>
            .
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <article
            className="mx-auto w-full max-w-md rounded-[1.25rem] border border-[#2a3f5c]/80 bg-[#0c1e38]/95 p-4 shadow-[0_24px_48px_rgba(0,0,0,0.35)]"
            aria-label="Exemple de conversation avec l’agent Sebavia"
          >
            <header className="mb-4 flex items-center gap-2.5 border-b border-white/10 pb-3">
              <span className="relative size-8 overflow-hidden rounded-full ring-1 ring-white/15">
                <Image
                  src={BRAND_ASSETS.logoBlanc}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="32px"
                  aria-hidden
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Sebavia</p>
                <p className="text-[0.7rem] text-white/50">
                  Copilote · texte{voiceIncluded ? " et voix" : ""}
                </p>
              </div>
              {voiceIncluded ? (
                <span
                  className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[0.65rem] text-white/80"
                  aria-hidden
                >
                  <Mic className="size-3" />
                  <span className="flex h-3 items-end gap-0.5">
                    <span
                      className="w-0.5 rounded-full bg-[#2dd4bf] motion-safe:animate-pulse"
                      style={{ height: "40%" }}
                    />
                    <span
                      className="w-0.5 rounded-full bg-[#2dd4bf] motion-safe:animate-pulse"
                      style={{ height: "80%" }}
                    />
                    <span
                      className="w-0.5 rounded-full bg-[#2dd4bf] motion-safe:animate-pulse"
                      style={{ height: "55%" }}
                    />
                  </span>
                </span>
              ) : null}
            </header>

            <div className="space-y-3">
              <p className="ml-6 rounded-2xl rounded-tr-md bg-white/10 px-3 py-2.5 text-[0.8rem] leading-relaxed text-white/90">
                <span className="sr-only">Utilisateur : </span>
                {agent.demoUser}
              </p>
              <p className="mr-2 rounded-2xl rounded-tl-md bg-gradient-to-br from-[#1a3358] to-[#2a1f4a] px-3 py-2.5 text-[0.8rem] leading-relaxed text-white/95">
                <span className="sr-only">Sebavia : </span>
                {agent.demoAssistant}
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[0.78rem] font-semibold text-white">
                  Restaurant familial · Trois-Pistoles
                </p>
                <p className="mt-0.5 text-[0.68rem] text-[#2dd4bf]">
                  À moins de 5 min de votre route
                </p>
              </div>
            </div>
          </article>
        </FadeIn>
      </div>
    </section>
  );
}
