import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";

/** Illustration décorative — étoile reliée à une route stylisée. */
function NameEtymologyVisual() {
  return (
    <svg
      viewBox="0 0 280 48"
      className="mx-auto h-10 w-full max-w-[17.5rem] text-[#f0b64d]"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="name-road-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f0b64d" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d="M8 34 C 72 34, 96 14, 148 18 C 196 22, 220 30, 252 22"
        fill="none"
        stroke="url(#name-road-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 7"
        className="name-meaning-road"
      />
      <path
        d="M258 12.5 L261.2 20.2 L269.5 21.2 L263.4 26.8 L265 35 L258 30.8 L251 35 L252.6 26.8 L246.5 21.2 L254.8 20.2 Z"
        fill="currentColor"
        className="name-meaning-star"
      />
    </svg>
  );
}

export function NameMeaningSection() {
  const { nameMeaning } = LANDING;

  return (
    <section
      className="scroll-mt-24 border-b border-[#dfe7ef] bg-[#f7f9fc] py-12 sm:py-14 lg:py-16"
      aria-labelledby="name-meaning-heading"
    >
      <div className="mx-auto max-w-[96rem] px-[clamp(1.5rem,4vw,4.5rem)]">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="name-meaning-heading"
              className="font-heading text-[1.5rem] font-bold tracking-tight text-[#082b46] sm:text-[1.85rem]"
            >
              {nameMeaning.title}
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-[#60758a] sm:text-[1.125rem]">
              {nameMeaning.intro}
            </p>
            <div className="mt-6">
              <NameEtymologyVisual />
              <p className="sr-only">
                Illustration : une route stylisée menant vers une étoile,
                symbole du nom Sebavio.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.04}>
          <div
            className="mx-auto mt-10 grid max-w-4xl gap-6 sm:gap-4 md:grid-cols-[1fr_auto_1fr_auto_1.15fr] md:items-center md:gap-3"
            role="group"
            aria-label="Étymologie du nom Sebavio"
          >
            <div className="rounded-2xl border border-[#dfe7ef] bg-white px-5 py-6 text-center shadow-[0_8px_24px_rgba(8,43,70,0.05)] sm:px-6">
              <p className="font-heading text-[1.65rem] font-bold tracking-[0.12em] text-[#082b46] uppercase">
                {nameMeaning.seba.word}
              </p>
              <p className="mt-1.5 text-[0.95rem] font-medium text-[#3b82f6]">
                {nameMeaning.seba.label}
              </p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[#60758a]">
                {nameMeaning.seba.body}
              </p>
            </div>

            <p
              className="font-heading text-center text-2xl font-light text-[#c9bda6] md:px-1"
              aria-hidden
            >
              +
            </p>

            <div className="rounded-2xl border border-[#dfe7ef] bg-white px-5 py-6 text-center shadow-[0_8px_24px_rgba(8,43,70,0.05)] sm:px-6">
              <p className="font-heading text-[1.65rem] font-bold tracking-[0.12em] text-[#082b46] uppercase">
                {nameMeaning.via.word}
              </p>
              <p className="mt-1.5 text-[0.95rem] font-medium text-[#3b82f6]">
                {nameMeaning.via.label}
              </p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[#60758a]">
                {nameMeaning.via.body}
              </p>
            </div>

            <p
              className="font-heading text-center text-2xl font-light text-[#c9bda6] md:px-1"
              aria-hidden
            >
              =
            </p>

            <div className="rounded-2xl border border-[#f0b64d]/35 bg-gradient-to-br from-white to-[#fff8eb] px-5 py-6 text-center shadow-[0_8px_24px_rgba(8,43,70,0.06)] sm:px-6 md:col-auto">
              <p className="font-heading text-[1.65rem] font-bold tracking-[0.08em] text-[#082b46] uppercase">
                {nameMeaning.result.word}
              </p>
              <p className="mt-1.5 text-[0.95rem] font-semibold text-[#0e2d46]">
                {nameMeaning.result.label}
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <p className="mx-auto mt-8 max-w-3xl text-center text-[1.05rem] leading-relaxed text-[#60758a] sm:text-[1.125rem]">
            {nameMeaning.result.body}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
