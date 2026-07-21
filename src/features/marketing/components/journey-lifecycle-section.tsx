import { CalendarCheck, Compass, MapPinned } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";

const ICONS = {
  before: MapPinned,
  during: Compass,
  after: CalendarCheck,
} as const;

export function JourneyLifecycleSection() {
  const { lifecycle } = LANDING;

  return (
    <section
      className="bg-white py-16 lg:py-[5rem]"
      aria-labelledby="lifecycle-heading"
    >
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-10">
        <FadeIn>
          <h2
            id="lifecycle-heading"
            className="font-heading mx-auto max-w-3xl text-center text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2rem]"
          >
            {lifecycle.title}
          </h2>
        </FadeIn>

        <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          {lifecycle.columns.map((col, index) => {
            const Icon = ICONS[col.id as keyof typeof ICONS] ?? MapPinned;
            return (
              <FadeIn key={col.id} delay={0.04 * index}>
                <article className="text-center">
                  <div className="relative mx-auto mb-4 flex size-[5.5rem] items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/25"
                      aria-hidden
                    />
                    <div className="relative flex size-16 items-center justify-center rounded-full border border-[#dfe7ef] bg-white shadow-sm">
                      <Icon className="size-7 text-[#3b82f6]" aria-hidden />
                    </div>
                    {col.id === "before" ? (
                      <span
                        className="absolute -right-1 -bottom-0.5 size-3 rounded-full bg-[#2dd4bf]"
                        aria-hidden
                      />
                    ) : null}
                    {col.id === "during" ? (
                      <span
                        className="absolute -top-0.5 -right-1 size-2.5 rounded-full bg-[#8b5cf6]"
                        aria-hidden
                      />
                    ) : null}
                    {col.id === "after" ? (
                      <span
                        className="absolute -bottom-1 left-2 size-2.5 rounded-full bg-[#fbbf24]"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                    {col.title}
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-left text-[0.875rem] text-[#60758a]">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)]"
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
