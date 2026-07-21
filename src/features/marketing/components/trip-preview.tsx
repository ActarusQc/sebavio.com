import {
  Clock,
  CloudSun,
  DollarSign,
  Fuel,
  MapPinned,
  MoreVertical,
  Route,
} from "lucide-react";
import type { ReactNode } from "react";
import { LANDING } from "../lib/landing-content";

/** Grande carte voyage — démonstration HTML (hero). */
export function TripPreview() {
  const trip = LANDING.tripDemo;

  return (
    <article
      className="flex w-full max-w-[37.5rem] flex-col rounded-[1.25rem] border border-[#2a3f5c]/80 bg-[#0c1e38]/92 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-5"
      aria-label={`Démonstration : ${trip.title}`}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[0.95rem] font-semibold text-white sm:text-base">
            {trip.title}
          </h3>
          <p className="mt-0.5 text-xs text-white/55">
            {trip.from} → {trip.to}
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[0.72rem] text-white/70">
            <li className="inline-flex items-center gap-1">
              <Clock className="size-3.5 shrink-0 text-[#38bdf8]" aria-hidden />
              <span>{trip.duration}</span>
            </li>
            <li className="inline-flex items-center gap-1">
              <Route className="size-3.5 shrink-0 text-[#38bdf8]" aria-hidden />
              <span>{trip.distance}</span>
            </li>
            <li className="inline-flex items-center gap-1">
              <MapPinned
                className="size-3.5 shrink-0 text-[#38bdf8]"
                aria-hidden
              />
              <span>{trip.steps}</span>
            </li>
          </ul>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-lg border border-white/20 px-2.5 py-1 text-[0.65rem] font-medium text-white/85">
            Enregistrer
          </span>
          <span
            className="inline-flex size-8 items-center justify-center rounded-lg border border-white/15 text-white/70"
            aria-hidden
          >
            <MoreVertical className="size-4" />
          </span>
        </div>
      </header>

      <div className="relative mb-3 min-h-[11.5rem] flex-[1.15] overflow-hidden rounded-xl border border-white/10 sm:min-h-[13.5rem]">
        <RouteMapIllustration />
        <div className="absolute right-2 bottom-2 flex flex-col overflow-hidden rounded-md border border-white/20 bg-[#0c1e38]/90 shadow">
          <span className="border-b border-white/15 px-2 py-0.5 text-sm text-white/80">
            +
          </span>
          <span className="px-2 py-0.5 text-sm text-white/80">−</span>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
        <p className="text-[0.65rem] font-medium tracking-wide text-white/45 uppercase">
          Prochain arrêt suggéré
        </p>
        <div className="mt-2 flex gap-3">
          <div
            className="h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#1e4a5c] via-[#2a5a6e] to-[#0e2d46]"
            aria-hidden
          >
            <div className="flex h-full items-end justify-center pb-1">
              <span className="rounded bg-black/35 px-1 text-[0.55rem] text-white/80">
                Démo
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {trip.nextStop.name}
            </p>
            <p className="truncate text-xs text-white/50">
              {trip.nextStop.detail}
            </p>
            <p className="mt-1 text-xs text-[#2dd4bf]">
              {trip.nextStop.detour}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<Fuel className="size-4 text-[#f87171]" aria-hidden />}
          label="Carburant"
          value={trip.fuelStops}
        />
        <StatCard
          icon={<DollarSign className="size-4 text-[#34d399]" aria-hidden />}
          label="Coût estimé"
          value={trip.estimatedCost}
        />
        <StatCard
          icon={<CloudSun className="size-4 text-[#fbbf24]" aria-hidden />}
          label={trip.weatherPlace}
          value={trip.weather}
        />
      </dl>
    </article>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[4.25rem] flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-1.5 py-2 text-center">
      {icon}
      <dt className="mt-1 text-[0.58rem] leading-tight text-white/45">
        {label}
      </dt>
      <dd className="mt-0.5 text-[0.7rem] leading-tight font-semibold text-white">
        {value}
      </dd>
    </div>
  );
}

function RouteMapIllustration() {
  return (
    <svg
      viewBox="0 0 560 320"
      className="size-full"
      role="img"
      aria-label="Carte illustrée Montréal vers Percé"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0a2238" />
          <stop offset="55%" stopColor="#12324c" />
          <stop offset="100%" stopColor="#0d2840" />
        </linearGradient>
        <linearGradient id="route" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="560" height="320" fill="url(#sea)" />
      {/* coastline / peninsula silhouette */}
      <path
        d="M40 250 C90 230 130 210 170 200 C220 185 260 150 310 140 C360 128 410 110 470 95 L520 80 L540 120 C500 150 460 190 430 230 C390 280 320 300 250 290 C180 280 100 275 40 250 Z"
        fill="#163a52"
        opacity="0.85"
      />
      <path
        d="M80 210 C140 195 190 175 240 165 C300 152 350 130 400 118 C440 110 480 98 510 88"
        fill="none"
        stroke="#1f4d6a"
        strokeWidth="18"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M70 220 C130 205 185 180 240 168 C305 152 360 128 415 115 C455 106 490 96 520 88"
        fill="none"
        stroke="url(#route)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#glow)"
      />
      {/* waypoints */}
      <circle cx="70" cy="220" r="7" fill="#2dd4bf" />
      <circle
        cx="70"
        cy="220"
        r="11"
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <circle cx="185" cy="185" r="4.5" fill="#60a5fa" />
      <circle cx="290" cy="155" r="4.5" fill="#60a5fa" />
      <circle cx="400" cy="118" r="4.5" fill="#60a5fa" />
      <circle cx="520" cy="88" r="8" fill="#f08a3c" />
      <circle
        cx="520"
        cy="88"
        r="12"
        fill="none"
        stroke="#f08a3c"
        strokeWidth="1.5"
        opacity="0.45"
      />
      <text
        x="82"
        y="238"
        fill="#94a3b8"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
      >
        Montréal
      </text>
      <text
        x="455"
        y="78"
        fill="#94a3b8"
        fontSize="12"
        fontFamily="system-ui,sans-serif"
      >
        Percé
      </text>
      <text
        x="175"
        y="175"
        fill="#64748b"
        fontSize="9"
        fontFamily="system-ui,sans-serif"
      >
        Québec
      </text>
      <text
        x="285"
        y="145"
        fill="#64748b"
        fontSize="9"
        fontFamily="system-ui,sans-serif"
      >
        Rimouski
      </text>
    </svg>
  );
}
