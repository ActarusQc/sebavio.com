import { FadeIn } from "@/components/common";
import { PRICING_PAGE } from "../lib/pricing-content";
import { ShieldCheck } from "lucide-react";

export function PricingTrust() {
  const { trust } = PRICING_PAGE;

  return (
    <section
      className="bg-[#f7f9fc] py-10 sm:py-12"
      aria-labelledby="pricing-trust-heading"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="pricing-trust-heading"
              className="font-heading text-xl font-bold tracking-tight text-[#082b46] sm:text-2xl"
            >
              {trust.title}
            </h2>
            <p className="mt-2 text-sm text-[#60758a]">
              {trust.activationNote}
            </p>
          </div>
          <ul className="mx-auto mt-7 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trust.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 rounded-xl border border-[#dfe7ef] bg-white px-3.5 py-3 text-sm text-[#082b46]/90"
              >
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-[#3b82f6]"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
