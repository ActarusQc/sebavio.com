import { FEATURES_PAGE } from "../lib/features-page-content";

export function FeaturesHowItWorks() {
  const { howItWorks } = FEATURES_PAGE;

  return (
    <section
      id="comment-ca-fonctionne"
      aria-labelledby="features-how-title"
      className="scroll-mt-28 border-b border-[#e6eef5] bg-[#f7fafc] py-12 sm:py-14"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id="features-how-title"
          className="font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl"
        >
          {howItWorks.title}
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {howItWorks.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-[#d7e0ea] bg-white p-5"
            >
              <p className="text-sm font-semibold tracking-wide text-[#3b6f9c]">
                Étape {index + 1}
              </p>
              <h3 className="font-heading mt-1 text-lg font-semibold text-[#082b46]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#60758a]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
