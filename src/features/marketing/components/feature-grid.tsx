import { Car, Fuel, MessageSquare, Wrench } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";
import { cn } from "@/lib/utils";

export function FeatureGrid() {
  const { features } = LANDING;

  return (
    <section
      id="fonctionnalites"
      className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-[5.5rem]"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-10">
        <FadeIn>
          <h2
            id="features-heading"
            className="font-heading mx-auto max-w-3xl text-center text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2rem]"
          >
            {features.title}
          </h2>
        </FadeIn>

        <div className="mt-10 grid gap-0 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
          {features.items.map((item, index) => (
            <FadeIn key={item.id} delay={0.03 * index}>
              <article
                className={cn(
                  "flex h-full flex-col px-1 py-4 sm:px-5 sm:py-2",
                  index > 0 && "xl:border-l xl:border-[#dfe7ef]",
                )}
              >
                <FeatureIllustration id={item.id} />
                <h3 className="font-heading mt-4 text-[1.05rem] font-semibold text-[#082b46]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-[#60758a]">
                  {item.body}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIllustration({ id }: { id: string }) {
  if (id === "chat") {
    return (
      <div className="space-y-2 rounded-2xl border border-[#dfe7ef] bg-[#f7f9fc] p-3.5 shadow-sm">
        <div className="ml-5 rounded-xl rounded-tr-sm bg-white px-2.5 py-2 text-[0.7rem] text-[#60758a] shadow-sm">
          Trouve 3 campings familiaux près de Percé
        </div>
        <div className="mr-3 rounded-xl rounded-tl-sm bg-[#0c1e38] px-2.5 py-2 text-[0.7rem] text-white">
          Voici 3 options adaptées à votre trajet…
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-10 flex-1 rounded-md bg-gradient-to-br from-[#cbd5e1] to-[#94a3b8]"
              aria-hidden
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[0.65rem] text-[#60758a]">
          <MessageSquare className="size-3.5 text-[#8b5cf6]" aria-hidden />
          Suggestions + ajout au trajet
        </div>
      </div>
    );
  }

  if (id === "fuel") {
    return (
      <div className="rounded-2xl border border-[#dfe7ef] bg-white p-3.5 shadow-sm">
        <p className="text-[0.7rem] font-semibold text-[#082b46]">
          Plan de carburant
        </p>
        <div className="mt-2 flex items-center justify-between text-[0.65rem]">
          <span className="inline-flex items-center gap-1 text-[#60758a]">
            <Fuel className="size-3.5 text-[#f87171]" aria-hidden />
            Niveau de départ
          </span>
          <span className="font-semibold text-[#082b46]">75 %</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eef2f7]">
          <div className="h-full w-3/4 rounded-full bg-[linear-gradient(90deg,#f87171,#fbbf24)]" />
        </div>
        <ul className="mt-3 space-y-2 text-[0.68rem] text-[#60758a]">
          <li className="flex justify-between border-b border-[#eef2f7] pb-1.5">
            <span>Arrêt 1 · ~280 km</span>
            <span className="font-medium text-[#082b46]">Région A</span>
          </li>
          <li className="flex justify-between border-b border-[#eef2f7] pb-1.5">
            <span>Arrêt 2 · ~520 km</span>
            <span className="font-medium text-[#082b46]">Région B</span>
          </li>
          <li className="flex justify-between">
            <span>Arrêt 3 · ~700 km</span>
            <span className="font-medium text-[#082b46]">Région C</span>
          </li>
        </ul>
      </div>
    );
  }

  if (id === "adapt") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-sm">
        <div className="relative flex h-[5.5rem] items-center justify-center bg-gradient-to-br from-[#e8f0f8] to-[#dbeafe]">
          <svg
            viewBox="0 0 200 80"
            className="absolute inset-0 size-full"
            aria-hidden
          >
            <path
              d="M10 60 C50 50 80 30 120 28 C150 26 170 40 190 35"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="10" cy="60" r="4" fill="#2dd4bf" />
            <circle cx="190" cy="35" r="4" fill="#f08a3c" />
          </svg>
          <div className="relative z-10 mx-3 rounded-lg border border-[#dfe7ef] bg-white px-2.5 py-1.5 shadow-sm">
            <p className="text-[0.65rem] font-medium text-[#082b46]">
              Activité ajoutée · +1 h 30
            </p>
            <p className="text-[0.6rem] text-[#60758a]">
              Exemple de démonstration
            </p>
          </div>
        </div>
        <div className="p-3">
          <span className="inline-flex rounded-lg bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-2.5 py-1.5 text-[0.68rem] font-semibold text-white">
            Recalculer l’itinéraire
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#dfe7ef] bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#e0f7f4]">
          <Car className="size-5 text-[#2dd4bf]" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#082b46]">
            Véhicule personnel
          </p>
          <p className="text-[0.65rem] text-[#60758a]">
            Exemple de démonstration
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.68rem] text-[#60758a]">
        <div className="rounded-lg bg-[#f7f9fc] p-2">
          <dt>Consommation</dt>
          <dd className="font-semibold text-[#082b46]">9,2 L/100 km</dd>
        </div>
        <div className="rounded-lg bg-[#f7f9fc] p-2">
          <dt>Réservoir</dt>
          <dd className="font-semibold text-[#082b46]">55 L</dd>
        </div>
        <div className="col-span-2 flex items-center gap-1.5 rounded-lg bg-[#f7f9fc] p-2">
          <Wrench className="size-3.5 text-[#f08a3c]" aria-hidden />
          <span>Entretien suivi dans Sebavio</span>
        </div>
      </dl>
    </div>
  );
}
