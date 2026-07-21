import {
  Clock,
  CloudSun,
  DollarSign,
  Fuel,
  MapPinned,
  Route,
} from "lucide-react";
import { LANDING } from "../lib/landing-content";

/** Carte voyage condensée — démonstration non interactive (hero). */
export function TripPreview() {
  const trip = LANDING.tripDemo;

  return (
    <article
      className="bg-sebavio-night-elevated/80 w-full max-w-md rounded-2xl border border-white/12 p-3 shadow-lg backdrop-blur-md sm:p-4"
      aria-label={`Démonstration : ${trip.title}`}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white sm:text-base">
            {trip.title}
          </h3>
          <p className="mt-0.5 text-xs text-white/60">
            {trip.from} → {trip.to}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-white/70 sm:text-xs">
            <li className="inline-flex items-center gap-1">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              <span>{trip.duration}</span>
            </li>
            <li className="inline-flex items-center gap-1">
              <Route className="size-3.5 shrink-0" aria-hidden />
              <span>{trip.distance}</span>
            </li>
            <li className="inline-flex items-center gap-1">
              <MapPinned className="size-3.5 shrink-0" aria-hidden />
              <span>{trip.steps}</span>
            </li>
          </ul>
        </div>
        <span className="shrink-0 rounded-lg border border-white/20 px-2.5 py-1 text-[0.65rem] font-medium text-white/80">
          Démo
        </span>
      </header>

      <div
        className="relative mb-3 aspect-[16/10] overflow-hidden rounded-xl border border-white/10"
        aria-hidden
      >
        <RouteMapIllustration />
      </div>

      <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
        <p className="text-[0.65rem] font-medium tracking-wide text-white/50 uppercase">
          Prochain arrêt suggéré
        </p>
        <div className="mt-1.5 flex gap-2.5">
          <div className="from-sebavio-slate/40 to-sebavio-navy flex size-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
            <MapPinned className="text-sebavio-teal size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {trip.nextStop.name}
            </p>
            <p className="truncate text-xs text-white/55">
              {trip.nextStop.detail}
            </p>
            <p className="text-sebavio-teal mt-0.5 text-xs">
              {trip.nextStop.detour}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
          <Fuel className="text-sebavio-coral mx-auto size-4" aria-hidden />
          <dt className="mt-1 text-[0.6rem] text-white/50">Carburant</dt>
          <dd className="text-[0.7rem] font-semibold text-white sm:text-xs">
            {trip.fuelStops}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
          <DollarSign
            className="text-sebavio-sage mx-auto size-4"
            aria-hidden
          />
          <dt className="mt-1 text-[0.6rem] text-white/50">Coût estimé</dt>
          <dd className="text-[0.7rem] font-semibold text-white sm:text-xs">
            {trip.estimatedCost}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
          <CloudSun className="text-sebavio-gold mx-auto size-4" aria-hidden />
          <dt className="mt-1 text-[0.6rem] text-white/50">
            {trip.weatherPlace}
          </dt>
          <dd className="text-[0.7rem] font-semibold text-white sm:text-xs">
            {trip.weather}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function RouteMapIllustration() {
  return (
    <svg
      viewBox="0 0 400 250"
      className="size-full"
      role="img"
      aria-label="Carte illustrée Montréal vers Percé"
    >
      <defs>
        <linearGradient id="mapSea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0e2d46" />
          <stop offset="100%" stopColor="#1a3a52" />
        </linearGradient>
        <linearGradient id="mapRoute" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="400" height="250" fill="url(#mapSea)" />
      <path
        d="M40 180 C90 170 110 140 150 130 C200 115 230 100 280 90 C320 82 350 70 370 55"
        fill="none"
        stroke="url(#mapRoute)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="40" cy="180" r="7" fill="#2bb8a8" />
      <circle cx="370" cy="55" r="8" fill="#f08a3c" />
      <text x="52" y="198" fill="#94a3b8" fontSize="11">
        Montréal
      </text>
      <text x="320" y="42" fill="#94a3b8" fontSize="11">
        Percé
      </text>
      <path
        d="M200 40 L260 50 L300 90 L280 140 L220 160 L180 120 Z"
        fill="#163a52"
        opacity="0.7"
      />
    </svg>
  );
}
