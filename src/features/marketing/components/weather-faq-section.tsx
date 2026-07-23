import Link from "next/link";
import { WEATHER_PAGE } from "../lib/weather-page-content";

export function WeatherFaqSection() {
  const { faq } = WEATHER_PAGE;

  return (
    <section
      id="faq-meteo"
      aria-labelledby="weather-faq-title"
      className="scroll-mt-28 border-b border-[#e6eef5] py-12 sm:py-14"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2
          id="weather-faq-title"
          className="font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl"
        >
          {faq.title}
        </h2>
        <dl className="mt-8 space-y-6">
          {faq.items.map((item) => (
            <div
              key={item.q}
              className="border-b border-[#e6eef5] pb-6 last:border-0"
            >
              <dt className="font-heading text-lg font-semibold text-[#082b46]">
                {item.q}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-[#60758a] sm:text-base">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm">
          <Link href={faq.moreHref} className="text-[#3b6f9c] hover:underline">
            {faq.moreLabel}
          </Link>
          {" · "}
          <Link href="/contact" className="text-[#3b6f9c] hover:underline">
            Contact
          </Link>
        </p>
      </div>
    </section>
  );
}
