import Image from "next/image";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";
import { MARKETING_ASSETS } from "../lib/marketing-assets";

const LIFECYCLE_VISUALS = {
  before: MARKETING_ASSETS.lifecycleBefore,
  during: MARKETING_ASSETS.lifecycleOnRoad,
  after: MARKETING_ASSETS.lifecycleAfter,
} as const;

export function JourneyLifecycleSection() {
  const { lifecycle } = LANDING;

  return (
    <section
      className="bg-white py-[3.5rem] sm:py-16 lg:py-[4.5rem]"
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

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
          {lifecycle.columns.map((col, index) => {
            const visual =
              LIFECYCLE_VISUALS[col.id as keyof typeof LIFECYCLE_VISUALS];

            return (
              <FadeIn key={col.id} delay={0.04 * index}>
                <article className="flex flex-col items-center text-center md:items-stretch md:text-left">
                  <figure className="relative mx-auto mb-6 aspect-square w-[12.5rem] shrink-0 sm:w-[14rem] md:mx-0 md:w-[13.5rem] lg:w-[15.5rem]">
                    <Image
                      src={visual.src}
                      alt={visual.alt}
                      width={visual.width}
                      height={visual.height}
                      sizes="(max-width: 768px) 72vw, 248px"
                      className="h-full w-full rounded-full object-cover shadow-[0_8px_24px_rgba(8,43,70,0.1)]"
                    />
                  </figure>
                  <h3 className="font-heading text-[1.35rem] font-semibold text-[#082b46] sm:text-[1.45rem]">
                    {col.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-left text-[1rem] leading-relaxed text-[#60758a] sm:text-[1.05rem]">
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
