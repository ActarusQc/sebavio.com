import { Check } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";

export function JourneyLifecycleSection() {
  const { lifecycle } = LANDING;

  return (
    <section
      className="bg-white py-[3.5rem] sm:py-16 lg:py-[4.25rem]"
      aria-labelledby="lifecycle-heading"
    >
      <div className="mx-auto max-w-[96rem] px-[clamp(1.5rem,4vw,4.5rem)]">
        <FadeIn>
          <h2
            id="lifecycle-heading"
            className="font-heading mx-auto max-w-3xl text-center text-[1.75rem] font-bold tracking-tight text-[#082b46] sm:text-[2.25rem] lg:text-[2.5rem]"
          >
            {lifecycle.title}
          </h2>
        </FadeIn>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {lifecycle.columns.map((col, index) => (
            <FadeIn key={col.id} delay={0.04 * index}>
              <article className="flex flex-col items-center text-center md:items-stretch md:text-left">
                <div className="mx-auto mb-5 size-[11.5rem] shrink-0 md:mx-0">
                  <LifecycleVisual id={col.id} />
                </div>
                <h3 className="font-heading text-[1.35rem] font-semibold text-[#082b46]">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-left text-[1rem] text-[#60758a]">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[#3b82f6]"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function LifecycleVisual({ id }: { id: string }) {
  if (id === "before") {
    return (
      <div className="relative size-full overflow-hidden rounded-full border-[6px] border-[#e8eef8] bg-gradient-to-br from-[#dbeafe] to-[#e0e7ff] shadow-[0_12px_32px_rgba(59,130,246,0.2)]">
        <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
          <path
            d="M30 140 C60 120 80 90 110 85 C140 80 160 95 175 70"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="30" cy="140" r="8" fill="#2dd4bf" />
          <circle cx="95" cy="95" r="7" fill="#8b5cf6" />
          <circle cx="140" cy="82" r="6" fill="#38bdf8" />
          <circle cx="175" cy="70" r="8" fill="#fb923c" />
          <rect
            x="55"
            y="40"
            width="70"
            height="36"
            rx="8"
            fill="white"
            opacity="0.92"
          />
          <text
            x="64"
            y="62"
            fontSize="10"
            fill="#082b46"
            fontFamily="system-ui"
          >
            Plan prêt
          </text>
        </svg>
      </div>
    );
  }

  if (id === "during") {
    return (
      <div className="relative size-full overflow-hidden rounded-full border-[6px] border-[#e8eef8] bg-gradient-to-b from-[#0c1e38] to-[#1e3a5f] shadow-[0_12px_32px_rgba(8,43,70,0.25)]">
        <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
          <path
            d="M0 130 L70 120 L100 125 L140 115 L200 128 L200 200 L0 200 Z"
            fill="#1a2f4a"
          />
          <path d="M0 145 L200 145" stroke="#475569" strokeWidth="10" />
          <path
            d="M20 145 L50 145 M70 145 L100 145 M120 145 L150 145 M170 145 L200 145"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="8 14"
            opacity="0.5"
          />
          <rect x="78" y="118" width="44" height="22" rx="4" fill="#334155" />
          <circle cx="88" cy="140" r="5" fill="#0f172a" />
          <circle cx="112" cy="140" r="5" fill="#0f172a" />
          <rect
            x="108"
            y="55"
            width="72"
            height="40"
            rx="12"
            fill="white"
            opacity="0.95"
          />
          <text
            x="116"
            y="80"
            fontSize="9"
            fill="#082b46"
            fontFamily="system-ui"
          >
            Prochaine pause?
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative size-full">
      <div className="absolute top-2 left-3 size-[70%] rotate-[-8deg] overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-[#2a6a5a] to-[#0e2d46] shadow-lg" />
      <div className="absolute right-2 bottom-2 size-[72%] rotate-[6deg] overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-[#3d5a80] to-[#1e3a5f] shadow-lg" />
      <span className="absolute right-3 bottom-4 inline-flex size-10 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-md">
        <Check className="size-5" aria-hidden />
      </span>
    </div>
  );
}
