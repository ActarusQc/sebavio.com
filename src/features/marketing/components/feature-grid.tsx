import { Car, Fuel, MessageSquare, Route, Wrench } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";

export function FeatureGrid() {
  const { features } = LANDING;

  return (
    <section
      id="fonctionnalites"
      className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2
            id="features-heading"
            className="font-heading text-sebavio-navy mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
          >
            {features.title}
          </h2>
        </FadeIn>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {features.items.map((item, index) => (
            <FadeIn key={item.id} delay={0.04 * index}>
              <article className="border-sebavio-sand/40 bg-sebavio-surface/60 hover:border-sebavio-slate/30 flex h-full flex-col rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md">
                <FeatureIllustration id={item.id} />
                <h3 className="font-heading text-sebavio-navy mt-4 text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="text-sebavio-muted mt-2 text-sm leading-relaxed">
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
      <div className="border-sebavio-sand/40 space-y-2 rounded-xl border bg-white p-3">
        <div className="bg-sebavio-surface text-sebavio-muted ml-6 rounded-xl rounded-tr-sm px-2.5 py-1.5 text-[0.65rem]">
          Trouve 3 campings familiaux près de Percé
        </div>
        <div className="bg-sebavio-navy/95 mr-4 rounded-xl rounded-tl-sm px-2.5 py-1.5 text-[0.65rem] text-white">
          Voici 3 options adaptées à votre trajet…
        </div>
        <div className="text-sebavio-slate flex items-center gap-1.5 text-[0.65rem]">
          <MessageSquare className="size-3.5" aria-hidden />
          Suggestions + ajout au trajet
        </div>
      </div>
    );
  }

  if (id === "fuel") {
    return (
      <div className="border-sebavio-sand/40 rounded-xl border bg-white p-3">
        <div className="flex items-center justify-between text-[0.65rem]">
          <span className="text-sebavio-muted inline-flex items-center gap-1">
            <Fuel className="text-sebavio-coral size-3.5" aria-hidden />
            Niveau de départ
          </span>
          <span className="text-sebavio-navy font-semibold">75 %</span>
        </div>
        <div className="bg-sebavio-surface mt-2 h-2 overflow-hidden rounded-full">
          <div className="from-sebavio-coral to-sebavio-gold h-full w-3/4 rounded-full bg-gradient-to-r" />
        </div>
        <ul className="text-sebavio-muted mt-3 space-y-1.5 text-[0.65rem]">
          <li className="flex justify-between">
            <span>Arrêt 1 · ~280 km</span>
            <span className="text-sebavio-navy font-medium">Région</span>
          </li>
          <li className="flex justify-between">
            <span>Arrêt 2 · ~520 km</span>
            <span className="text-sebavio-navy font-medium">Région</span>
          </li>
          <li className="flex justify-between">
            <span>Arrêt 3 · ~700 km</span>
            <span className="text-sebavio-navy font-medium">Région</span>
          </li>
        </ul>
      </div>
    );
  }

  if (id === "adapt") {
    return (
      <div className="border-sebavio-sand/40 rounded-xl border bg-white p-3">
        <div className="from-sebavio-surface to-sebavio-teal-soft relative flex h-20 items-center justify-center rounded-lg bg-gradient-to-br">
          <Route className="text-sebavio-slate size-8" aria-hidden />
        </div>
        <p className="text-sebavio-navy mt-2 text-[0.7rem] font-medium">
          Nouvelle activité ajoutée (+1 h 30)
        </p>
        <span className="from-sebavio-gradient-from to-sebavio-gradient-to mt-2 inline-flex rounded-lg bg-gradient-to-r px-2.5 py-1 text-[0.65rem] font-semibold text-white">
          Recalculer l’itinéraire
        </span>
      </div>
    );
  }

  return (
    <div className="border-sebavio-sand/40 rounded-xl border bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="bg-sebavio-teal-soft inline-flex size-10 items-center justify-center rounded-xl">
          <Car className="text-sebavio-teal size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sebavio-navy text-sm font-semibold">
            Véhicule personnel
          </p>
          <p className="text-sebavio-muted text-[0.65rem]">
            Exemple de démonstration
          </p>
        </div>
      </div>
      <dl className="text-sebavio-muted mt-3 grid grid-cols-2 gap-2 text-[0.65rem]">
        <div>
          <dt>Consommation</dt>
          <dd className="text-sebavio-navy font-semibold">9,2 L/100 km</dd>
        </div>
        <div>
          <dt>Réservoir</dt>
          <dd className="text-sebavio-navy font-semibold">55 L</dd>
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <Wrench className="text-sebavio-orange size-3" aria-hidden />
          <span>Prochain entretien suivi dans Sebavio</span>
        </div>
      </dl>
    </div>
  );
}
