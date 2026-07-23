import Image from "next/image";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { ASSISTANT_PAGE } from "../lib/assistant-page-content";

export function AssistantConversationDemo() {
  const { demo } = ASSISTANT_PAGE;

  return (
    <section
      aria-labelledby="assistant-demo-title"
      className="border-b border-[#e6eef5] bg-[#f7fafc] py-12 sm:py-14"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id="assistant-demo-title"
          className="font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl"
        >
          {demo.label}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#60758a]">
          {demo.disclaimer}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article
            className="rounded-2xl border border-[#2a3f5c]/80 bg-[#0c1e38] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)] sm:p-5"
            aria-label="Exemple de conversation illustrative"
          >
            <header className="mb-4 flex items-center gap-2.5 border-b border-white/10 pb-3">
              <span className="relative size-8 overflow-hidden rounded-full ring-1 ring-white/15">
                <Image
                  src={BRAND_ASSETS.logoBlanc}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="32px"
                  aria-hidden
                />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Sebavia</p>
                <p className="text-[0.7rem] text-white/50">
                  Exemple non interactif
                </p>
              </div>
            </header>
            <ul className="space-y-3">
              {demo.turns.map((turn) => (
                <li
                  key={turn.text}
                  className={
                    turn.role === "user"
                      ? "ml-6 rounded-2xl rounded-tr-md bg-white/10 px-3 py-2.5 text-sm leading-relaxed text-white/90"
                      : "mr-4 rounded-2xl rounded-tl-md bg-gradient-to-br from-[#1a3358] to-[#2a1f4a] px-3 py-2.5 text-sm leading-relaxed text-white/95"
                  }
                >
                  <span className="sr-only">
                    {turn.role === "user" ? "Voyageur : " : "Sebavia : "}
                  </span>
                  {turn.text}
                </li>
              ))}
            </ul>
          </article>

          <aside className="rounded-2xl border border-[#d7e0ea] bg-white p-5">
            <h3 className="font-heading text-lg font-semibold text-[#082b46]">
              Ce que la proposition peut regrouper
            </h3>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#405466]">
              {demo.resultItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[#60758a]">
              Aucun lieu précis n’est garanti ici : l’exemple montre le
              déroulement de la conversation, pas un résultat réservé.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
