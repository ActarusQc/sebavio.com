import { FadeIn } from "@/components/common";
import { PRICING_PAGE } from "../lib/pricing-content";

export function PricingFaq() {
  const { faq } = PRICING_PAGE;

  return (
    <section
      className="bg-white py-12 sm:py-16"
      aria-labelledby="pricing-faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2
            id="pricing-faq-heading"
            className="font-heading text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2.1rem]"
          >
            {faq.title}
          </h2>
        </FadeIn>

        <div className="mt-8 space-y-3">
          {faq.items.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-[#dfe7ef] bg-[#f7f9fc]/50 open:bg-white open:shadow-[0_8px_24px_rgba(8,43,70,0.06)]"
            >
              <summary className="font-heading cursor-pointer list-none px-4 py-3.5 text-left text-[0.98rem] font-semibold text-[#082b46] marker:content-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/45 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  {item.q}
                  <span
                    className="mt-0.5 shrink-0 text-[#3b82f6] transition-transform duration-200 group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-[#dfe7ef] px-4 py-3.5 text-sm leading-relaxed text-[#60758a]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
