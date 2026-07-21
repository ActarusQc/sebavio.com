/** Miniatures d’interface marketing — démonstrations statiques. */

import Image from "next/image";
import { Fuel } from "lucide-react";
import { MARKETING_ASSETS } from "../lib/marketing-assets";

const DESTINATION_SUGGESTIONS = [
  MARKETING_ASSETS.suggestionDestination1,
  MARKETING_ASSETS.suggestionDestination2,
  MARKETING_ASSETS.suggestionDestination3,
] as const;

export function MarketingConversationMini() {
  return (
    <div className="relative flex min-h-[15.5rem] flex-col justify-end overflow-hidden rounded-2xl border border-[#dfe7ef] bg-[#f7f9fc] p-3.5 shadow-[0_10px_28px_rgba(8,43,70,0.07)] sm:min-h-[16.5rem]">
      <div className="mb-2.5 ml-7 rounded-2xl rounded-tr-md bg-[#0c1e38] px-3.5 py-2.5 text-[0.8rem] leading-snug text-white shadow-sm">
        Trouve-nous 3 campings près de l’eau sur le trajet vers Percé.
      </div>
      <div className="mr-5 mb-3 rounded-2xl rounded-tl-md border border-[#dfe7ef] bg-white px-3.5 py-2.5 text-[0.8rem] leading-snug text-[#082b46] shadow-sm">
        Voici 3 options familiales sur votre parcours, sans détour important.
      </div>
      <div
        className="relative mx-auto h-[7.5rem] w-full max-w-[17.5rem]"
        aria-label="Suggestions de destinations"
      >
        {DESTINATION_SUGGESTIONS.map((img, i) => (
          <div
            key={img.src}
            className="absolute overflow-hidden rounded-xl shadow-[0_8px_20px_rgba(8,43,70,0.14)]"
            style={{
              width: "58%",
              aspectRatio: `${img.width} / ${img.height}`,
              left: `${i * 18}%`,
              bottom: i === 1 ? "0.35rem" : "0",
              zIndex: i === 1 ? 3 : i === 2 ? 2 : 1,
              transform: `rotate(${i === 0 ? -7 : i === 1 ? 0 : 7}deg)`,
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              sizes="(max-width: 768px) 42vw, 160px"
              className="h-auto w-full object-cover"
            />
          </div>
        ))}
      </div>
      <span
        className="pointer-events-none absolute top-2.5 left-2.5 inline-flex size-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-[0.65rem] font-bold text-white shadow"
        aria-hidden
      >
        ✦
      </span>
    </div>
  );
}

export function MarketingFuelPlanMini() {
  const stops = [
    { label: "Arrêt 1 — 250 km", place: "Trois-Rivières" },
    { label: "Arrêt 2 — 520 km", place: "Rimouski" },
    { label: "Arrêt 3 — 1 020 km", place: "Percé" },
  ];

  return (
    <div className="min-h-[15.5rem] rounded-2xl border border-[#dfe7ef] bg-white p-4 shadow-[0_10px_28px_rgba(8,43,70,0.07)] sm:min-h-[16.5rem]">
      <div className="flex items-center justify-between">
        <p className="text-[0.9rem] font-semibold text-[#082b46]">
          Plan de carburant
        </p>
        <span className="rounded-md bg-[#fff7ed] px-1.5 py-0.5 text-[0.65rem] font-medium text-[#fb923c]">
          Démo
        </span>
      </div>
      <div className="mt-3.5 flex items-end justify-between gap-2">
        <div>
          <p className="text-[0.7rem] text-[#60758a]">Niveau de départ</p>
          <p className="text-xl font-bold text-[#082b46]">75 %</p>
        </div>
        <div
          className="mb-1 size-11 rounded-full border-[3px] border-[#fb923c] border-r-transparent"
          aria-hidden
        />
      </div>
      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[#eef2f7]">
        <div className="h-full w-3/4 rounded-full bg-[linear-gradient(90deg,#fb923c,#fbbf24)]" />
      </div>
      <ul className="relative mt-4 space-y-0">
        {stops.map((s, i) => (
          <li key={s.label} className="relative flex gap-3 pb-3 last:pb-0">
            {i < stops.length - 1 ? (
              <span className="absolute top-5 left-[0.55rem] h-[calc(100%-0.5rem)] w-px border-l border-dashed border-[#cbd5e1]" />
            ) : null}
            <span className="relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5] text-[#059669]">
              <Fuel className="size-3" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[0.8rem]">
              <p className="font-semibold text-[#082b46]">{s.label}</p>
              <p className="font-medium text-[#082b46]">{s.place}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingRouteAdaptMini() {
  return (
    <div className="relative min-h-[15.5rem] overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_10px_28px_rgba(8,43,70,0.07)] sm:min-h-[16.5rem]">
      <svg
        viewBox="0 0 280 180"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="adaptMap" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="50%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#ecfdf5" />
          </linearGradient>
        </defs>
        <rect width="280" height="180" fill="url(#adaptMap)" />
        <path
          d="M20 130 C70 120 90 80 140 75 C180 70 210 95 260 65"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="20" cy="130" r="6" fill="#2dd4bf" />
        <circle cx="150" cy="74" r="7" fill="#8b5cf6" />
        <circle cx="260" cy="65" r="6" fill="#fb923c" />
      </svg>
      <div className="absolute top-3.5 right-3.5 left-3.5 rounded-xl border border-[#dfe7ef] bg-white/95 p-3 shadow-md backdrop-blur-sm">
        <p className="text-[0.8rem] font-semibold text-[#082b46]">
          Nouvelle activité ajoutée
        </p>
        <p className="mt-0.5 text-[0.75rem] text-[#60758a]">
          Phare de Cap-des-Rosiers · +1 h 30
        </p>
        <span className="mt-2.5 inline-flex rounded-lg bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-3 py-1.5 text-[0.75rem] font-semibold text-white">
          Recalculer l’itinéraire
        </span>
      </div>
    </div>
  );
}

export function MarketingVehicleMini({
  name = "Ford Escape 2020",
  consumption = "9,2 L/100 km",
  tank = "55 L",
  maintenance = "Dans 3 500 km",
  imageAlt = MARKETING_ASSETS.vehicleSuv.alt,
}: {
  name?: string;
  consumption?: string;
  tank?: string;
  maintenance?: string;
  /** Alt adapté si réutilisé dans un autre contexte (ex. étape 1). */
  imageAlt?: string;
}) {
  const vehicle = MARKETING_ASSETS.vehicleSuv;

  return (
    <div className="min-h-[15.5rem] overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_10px_28px_rgba(8,43,70,0.07)] sm:min-h-[16.5rem]">
      <div className="relative flex h-[8.5rem] items-end justify-center bg-gradient-to-b from-[#eef3f8] to-[#f7f9fc] px-4 pb-1 sm:h-[9rem]">
        <Image
          src={vehicle.src}
          alt={imageAlt}
          width={vehicle.width}
          height={vehicle.height}
          sizes="(max-width: 768px) 70vw, 260px"
          className="h-[6.75rem] w-auto max-w-full object-contain drop-shadow-[0_10px_18px_rgba(8,43,70,0.18)] sm:h-[7.25rem]"
        />
      </div>
      <div className="space-y-2.5 p-4">
        <div>
          <p className="text-[1rem] font-semibold text-[#082b46]">{name}</p>
          <p className="text-[0.7rem] text-[#60758a]">
            Exemple de démonstration
          </p>
        </div>
        <dl className="space-y-2 text-[0.8rem]">
          <div className="flex items-center justify-between border-b border-[#eef2f7] pb-1.5">
            <dt className="text-[#60758a]">Consommation moyenne</dt>
            <dd className="font-semibold text-[#082b46]">{consumption}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-[#eef2f7] pb-1.5">
            <dt className="text-[#60758a]">Capacité du réservoir</dt>
            <dd className="font-semibold text-[#082b46]">{tank}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[#60758a]">Prochain entretien</dt>
            <dd className="font-semibold text-[#082b46]">{maintenance}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
