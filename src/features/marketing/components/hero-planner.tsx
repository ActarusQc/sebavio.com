"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BRAND_ASSETS } from "../lib/brand-assets";

const TABS = [
  {
    id: "planifier",
    label: "Planifier un itinéraire",
    shortLabel: "Itinéraire",
    href: "#planifier",
    icon: BRAND_ASSETS.icons.planification.blanc,
    active: true,
  },
  {
    id: "vehicules",
    label: "Mes véhicules",
    shortLabel: "Véhicules",
    href: "/login?callbackUrl=/dashboard/vehicles",
    icon: BRAND_ASSETS.icons.campingcar.teal,
    active: false,
  },
  {
    id: "entretien",
    label: "Entretien",
    shortLabel: "Entretien",
    href: "/login?callbackUrl=/dashboard/maintenance",
    icon: BRAND_ASSETS.icons.entretien.teal,
    active: false,
  },
  {
    id: "decouvrir",
    label: "Découvrir",
    shortLabel: "Découvrir",
    href: "/fonctionnalites",
    icon: BRAND_ASSETS.icons.boussole.teal,
    active: false,
  },
] as const;

/**
 * Panneau visuel de planification (accueil).
 * Redirige vers l’inscription existante — aucune création de voyage côté API.
 */
export function HeroPlanner() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("camping-car");

  function swapLocations() {
    setOrigin(destination);
    setDestination(origin);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (origin.trim()) params.set("from", origin.trim());
    if (destination.trim()) params.set("to", destination.trim());
    if (vehicleType) params.set("vehicleType", vehicleType);
    const query = params.toString();
    router.push(query ? `/register?${query}` : "/register");
  }

  return (
    <div
      id="planifier"
      className="relative z-20 mx-auto w-full max-w-full min-w-0"
    >
      {/* Onglets : scroll horizontal contenu dans la largeur, sans élargir la page */}
      <div
        className="flex w-full min-w-0 [scrollbar-width:none] gap-1 overflow-x-auto overscroll-x-contain px-0.5 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Accès rapide"
      >
        {TABS.map((tab) => {
          const content = (
            <>
              <span className="relative size-3.5 shrink-0 sm:size-5">
                <Image
                  src={tab.icon}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="20px"
                />
              </span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden whitespace-nowrap sm:inline">
                {tab.label}
              </span>
            </>
          );

          const tabClass = cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-t-xl px-2.5 py-2 text-[0.7rem] font-medium sm:gap-2 sm:rounded-t-2xl sm:px-4 sm:py-2.5 sm:text-sm",
          );

          if (tab.active) {
            return (
              <span
                key={tab.id}
                role="tab"
                aria-selected="true"
                aria-label={tab.label}
                className={cn(
                  tabClass,
                  "bg-sebavio-navy text-sebavio-background font-semibold shadow-sm",
                )}
              >
                {content}
              </span>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected="false"
              aria-label={tab.label}
              className={cn(
                tabClass,
                "text-sebavio-navy/80 bg-[#e8ecec] transition-colors hover:bg-[#dfe5e5]",
              )}
            >
              {content}
            </Link>
          );
        })}
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-card grid w-full min-w-0 grid-cols-1 gap-2 rounded-tr-2xl rounded-b-2xl border border-white/40 p-3 shadow-[0_12px_40px_rgb(14_45_70/0.2)] sm:gap-3 sm:p-4 lg:grid-cols-[1.1fr_auto_1.1fr_minmax(9rem,12rem)_auto] lg:items-end lg:gap-3 lg:p-5"
      >
        <label className="grid min-w-0 gap-1">
          <span className="text-sebavio-muted text-xs font-medium">Départ</span>
          <span className="relative block min-w-0">
            <MapPin
              className="text-sebavio-slate pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 sm:left-3"
              aria-hidden
            />
            <Input
              name="origin"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder="Ville ou adresse"
              className="bg-sebavio-background h-10 w-full min-w-0 rounded-xl border-[#d7dedf] pl-8 text-sm sm:h-11 sm:pl-9"
              autoComplete="address-line1"
            />
          </span>
        </label>

        <div className="flex items-center justify-center py-0 lg:items-end lg:py-0 lg:pb-0.5">
          <button
            type="button"
            onClick={swapLocations}
            className="text-sebavio-slate hover:bg-sebavio-sand/25 focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none sm:size-10"
            aria-label="Inverser départ et arrivée"
          >
            <ArrowLeftRight className="size-3.5 rotate-90 sm:size-4 lg:rotate-0" />
          </button>
        </div>

        <label className="grid min-w-0 gap-1">
          <span className="text-sebavio-muted text-xs font-medium">
            Arrivée
          </span>
          <span className="relative block min-w-0">
            <MapPin
              className="text-sebavio-gold pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 sm:left-3"
              aria-hidden
            />
            <Input
              name="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Ville ou adresse"
              className="bg-sebavio-background h-10 w-full min-w-0 rounded-xl border-[#d7dedf] pl-8 text-sm sm:h-11 sm:pl-9"
              autoComplete="address-line2"
            />
          </span>
        </label>

        <label className="grid min-w-0 gap-1">
          <span className="text-sebavio-muted text-xs font-medium">
            Type de véhicule
          </span>
          <span className="relative block min-w-0">
            <span className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 sm:left-3 sm:size-5">
              <Image
                src={BRAND_ASSETS.icons.campingcar.teal}
                alt=""
                fill
                className="object-contain"
                sizes="20px"
              />
            </span>
            <select
              name="vehicleType"
              value={vehicleType}
              onChange={(event) => setVehicleType(event.target.value)}
              className={cn(
                "border-input bg-sebavio-background text-foreground h-10 w-full min-w-0 appearance-none rounded-xl border border-[#d7dedf] py-1 pr-8 pl-8 text-sm outline-none sm:h-11 sm:pr-9 sm:pl-10",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
              )}
            >
              <option value="camping-car">Camping-car</option>
              <option value="van">Van</option>
              <option value="vr">VR / caravane</option>
              <option value="voiture">Voiture</option>
            </select>
            <ChevronDown
              className="text-sebavio-muted pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 sm:right-3"
              aria-hidden
            />
          </span>
        </label>

        <button
          type="submit"
          className="font-heading focus-visible:ring-ring mt-1 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f0b64d] to-[#e8923a] px-4 text-sm font-semibold text-white shadow-md transition-[filter] hover:brightness-105 focus-visible:ring-2 focus-visible:outline-none sm:h-11 lg:mt-0 lg:w-auto lg:min-w-[12rem] lg:px-5"
        >
          <span className="truncate">Planifier mon voyage</span>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </button>
      </form>
    </div>
  );
}
