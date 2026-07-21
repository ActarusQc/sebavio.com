"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TripSectionId =
  "apercu" | "itineraire" | "carburant" | "activites" | "informations";

const TABS: Array<{ id: TripSectionId; label: string; href: string }> = [
  { id: "apercu", label: "Aperçu", href: "#trip-overview-map" },
  { id: "itineraire", label: "Itinéraire", href: "#trip-itinerary-section" },
  { id: "carburant", label: "Carburant", href: "#trip-fuel-section" },
  { id: "activites", label: "Activités", href: "#trip-activities-section" },
  { id: "informations", label: "Informations", href: "#trip-overview-section" },
];

function sectionFromHash(hash: string): TripSectionId {
  const h = hash.replace(/^#/, "");
  if (h === "trip-itinerary-section") return "itineraire";
  if (h === "trip-fuel-section") return "carburant";
  if (h === "trip-activities-section" || h === "trip-selected-activities")
    return "activites";
  if (h === "trip-overview-section") return "informations";
  return "apercu";
}

export function TripSectionNav({ className }: { className?: string }) {
  const [active, setActive] = useState<TripSectionId>(() =>
    typeof window !== "undefined"
      ? sectionFromHash(window.location.hash)
      : "apercu",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onHash = () => setActive(sectionFromHash(window.location.hash));
    window.addEventListener("hashchange", onHash);

    const ids = TABS.map((t) => t.href.slice(1));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (typeof IntersectionObserver === "undefined") {
      return () => {
        window.removeEventListener("hashchange", onHash);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0),
          );
        const top = visible[0]?.target?.id;
        if (top) setActive(sectionFromHash(top));
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => {
      window.removeEventListener("hashchange", onHash);
      observer.disconnect();
    };
  }, []);

  const onNavigate = useCallback((href: string, id: TripSectionId) => {
    setActive(id);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", href);
    }
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-14 z-30 -mx-1 border-b border-slate-200/80 bg-[#f7fafc]/95 backdrop-blur-md sm:top-16",
        className,
      )}
      aria-label="Sections du voyage"
      data-testid="trip-section-nav"
    >
      <ul className="flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 py-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <li key={tab.id} className="shrink-0">
              <a
                href={tab.href}
                data-testid={`trip-nav-${tab.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-lg px-3.5 text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none sm:text-[14px]",
                  isActive
                    ? "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80"
                    : "text-sebavio-navy/70 hover:text-sebavio-navy hover:bg-white",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(tab.href, tab.id);
                }}
              >
                {tab.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
