/** Miniatures d’interface marketing — démonstrations statiques. */

import { Fuel } from "lucide-react";

export function MarketingConversationMini() {
  return (
    <div
      className="relative flex min-h-[15.5rem] flex-col justify-end overflow-hidden rounded-2xl border border-[#dfe7ef] bg-[#f7f9fc] p-3 shadow-[0_8px_24px_rgba(8,43,70,0.06)]"
      aria-hidden
    >
      <div className="mb-2 ml-6 rounded-2xl rounded-tr-md bg-[#0c1e38] px-3 py-2 text-[0.7rem] leading-snug text-white shadow-sm">
        Trouve-nous 3 campings près de l’eau sur le trajet vers Percé.
      </div>
      <div className="mr-4 mb-2 rounded-2xl rounded-tl-md border border-[#dfe7ef] bg-white px-3 py-2 text-[0.7rem] leading-snug text-[#082b46] shadow-sm">
        Voici 3 options familiales sur votre parcours, sans détour important.
      </div>
      <div className="flex gap-2">
        {["#1e4a5c", "#2a6a5a", "#3d5a80"].map((c, i) => (
          <div
            key={c}
            className="relative h-[3.6rem] flex-1 overflow-hidden rounded-lg shadow-sm"
            style={{
              background: `linear-gradient(145deg, ${c}, #0e2d46)`,
            }}
          >
            <span className="absolute right-1 bottom-1 rounded bg-black/40 px-1 text-[0.55rem] text-white/90">
              Camping {i + 1}
            </span>
          </div>
        ))}
      </div>
      <span className="pointer-events-none absolute top-2.5 left-2.5 inline-flex size-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-[0.65rem] font-bold text-white shadow">
        ✦
      </span>
    </div>
  );
}

export function MarketingFuelPlanMini() {
  const stops = [
    { label: "Arrêt 1", km: "~280 km", place: "Région A" },
    { label: "Arrêt 2", km: "~520 km", place: "Région B" },
    { label: "Arrêt 3", km: "~700 km", place: "Région C" },
  ];

  return (
    <div
      className="min-h-[15.5rem] rounded-2xl border border-[#dfe7ef] bg-white p-3.5 shadow-[0_8px_24px_rgba(8,43,70,0.06)]"
      aria-hidden
    >
      <div className="flex items-center justify-between">
        <p className="text-[0.8rem] font-semibold text-[#082b46]">
          Plan de carburant
        </p>
        <span className="rounded-md bg-[#fff7ed] px-1.5 py-0.5 text-[0.6rem] font-medium text-[#fb923c]">
          Démo
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[0.65rem] text-[#60758a]">Niveau de départ</p>
          <p className="text-lg font-bold text-[#082b46]">75 %</p>
        </div>
        <div className="mb-1 h-10 w-10 rounded-full border-[3px] border-[#fb923c] border-r-transparent" />
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2f7]">
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
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[0.72rem]">
              <div>
                <p className="font-semibold text-[#082b46]">{s.label}</p>
                <p className="text-[#60758a]">{s.km}</p>
              </div>
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
    <div
      className="relative min-h-[15.5rem] overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_8px_24px_rgba(8,43,70,0.06)]"
      aria-hidden
    >
      <svg viewBox="0 0 280 160" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id="adaptMap" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="50%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#ecfdf5" />
          </linearGradient>
        </defs>
        <rect width="280" height="160" fill="url(#adaptMap)" />
        <path
          d="M20 120 C70 110 90 70 140 65 C180 60 210 85 260 55"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="20" cy="120" r="6" fill="#2dd4bf" />
        <circle cx="150" cy="64" r="7" fill="#8b5cf6" />
        <circle cx="260" cy="55" r="6" fill="#fb923c" />
      </svg>
      <div className="absolute top-3 right-3 left-3 rounded-xl border border-[#dfe7ef] bg-white/95 p-2.5 shadow-md backdrop-blur-sm">
        <p className="text-[0.72rem] font-semibold text-[#082b46]">
          Nouvelle activité ajoutée
        </p>
        <p className="mt-0.5 text-[0.68rem] text-[#60758a]">
          Musée de la Gaspésie · +1 h 30
        </p>
        <span className="mt-2 inline-flex rounded-lg bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-2.5 py-1.5 text-[0.68rem] font-semibold text-white">
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
  maintenance = "Dans 3 000 km",
}: {
  name?: string;
  consumption?: string;
  tank?: string;
  maintenance?: string;
}) {
  return (
    <div
      className="min-h-[15.5rem] overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_8px_24px_rgba(8,43,70,0.06)]"
      aria-hidden
    >
      <div className="relative flex h-[6.5rem] items-end justify-center bg-gradient-to-b from-[#e8eef5] to-[#f7f9fc] px-3 pb-2">
        <VehicleSilhouette />
      </div>
      <div className="space-y-2.5 p-3.5">
        <div>
          <p className="text-[0.9rem] font-semibold text-[#082b46]">{name}</p>
          <p className="text-[0.65rem] text-[#60758a]">
            Exemple de démonstration
          </p>
        </div>
        <dl className="space-y-2 text-[0.72rem]">
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

function VehicleSilhouette() {
  return (
    <svg viewBox="0 0 220 80" className="h-[4.5rem] w-full max-w-[14rem]">
      <ellipse cx="110" cy="72" rx="70" ry="5" fill="#cbd5e1" opacity="0.5" />
      <path
        d="M28 55 L42 38 C50 28 62 22 78 20 L130 18 C150 18 168 24 180 34 L198 52 L198 60 L28 60 Z"
        fill="#64748b"
      />
      <path
        d="M55 38 L70 24 L125 22 L155 34 L55 38 Z"
        fill="#94a3b8"
        opacity="0.7"
      />
      <circle cx="58" cy="60" r="11" fill="#1e293b" />
      <circle cx="58" cy="60" r="5" fill="#94a3b8" />
      <circle cx="168" cy="60" r="11" fill="#1e293b" />
      <circle cx="168" cy="60" r="5" fill="#94a3b8" />
      <rect x="185" y="48" width="8" height="5" rx="1" fill="#fb923c" />
    </svg>
  );
}
