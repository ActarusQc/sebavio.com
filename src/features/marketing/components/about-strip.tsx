import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";

/** Courte définition visible — détail déplacé vers /faq. */
export function AboutStrip() {
  return (
    <section
      id="a-propos"
      className="scroll-mt-24 border-y border-[#dfe7ef] bg-white py-10 sm:py-12"
      aria-labelledby="about-strip-heading"
    >
      <div className="mx-auto max-w-[96rem] px-[clamp(1.5rem,4vw,4.5rem)]">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="about-strip-heading"
              className="font-heading text-[1.5rem] font-bold text-[#082b46] sm:text-[1.75rem]"
            >
              Qu’est-ce que Sebavio?
            </h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-[#60758a] sm:text-[1.125rem]">
              {LANDING.definition}
            </p>
            <Link
              href="/faq"
              className="mt-5 inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-[#3b82f6] transition-colors hover:text-[#8b5cf6]"
            >
              Consulter la FAQ
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
