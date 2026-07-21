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
      className="bg-white py-16 sm:py-20 lg:py-24"
      aria-labelledby="lifecycle-heading"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2
            id="lifecycle-heading"
            className="font-heading text-sebavio-navy mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {lifecycle.title}
          </h2>
        </FadeIn>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {lifecycle.columns.map((col, index) => {
            const Icon = ICONS[col.id as keyof typeof ICONS] ?? MapPinned;
            return (
              <FadeIn key={col.id} delay={0.05 * index}>
                <article className="text-center md:text-left">
                  <div className="from-sebavio-gradient-from/15 to-sebavio-gradient-to/20 mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br md:mx-0">
                    <Icon className="text-sebavio-slate size-7" aria-hidden />
                  </div>
                  <h3 className="font-heading text-sebavio-navy text-lg font-semibold">
                    {col.title}
                  </h3>
                  <ul className="text-sebavio-muted mt-4 space-y-2 text-sm">
                    {col.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start justify-center gap-2 md:justify-start"
                      >
                        <span
                          className="from-sebavio-gradient-from to-sebavio-gradient-to mt-1.5 size-1.5 shrink-0 rounded-full bg-gradient-to-r"
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
