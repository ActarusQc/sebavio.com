"use client";

import { useId, useState, type ComponentType } from "react";
import { ChevronDown, Tent } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleDef = {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const MODULES: ModuleDef[] = [
  { id: "campings", title: "Campings", icon: Tent },
];

/**
 * Accordéons préparés pour modules futurs (pas d'API fictive).
 * Les panneaux météo / campings / activités restent branchés ailleurs si fournis.
 */
export function TripFutureModules() {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      className="trip-card divide-y divide-[rgb(14_45_70/0.08)] overflow-hidden p-0"
      data-testid="trip-future-modules"
      aria-label="Modules à venir"
    >
      {MODULES.map((mod) => {
        const open = openId === mod.id;
        const panelId = `${baseId}-${mod.id}-panel`;
        const Icon = mod.icon;
        return (
          <div key={mod.id}>
            <button
              type="button"
              className="focus-visible:ring-sebavio-teal flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : mod.id)}
            >
              <span
                className="bg-sebavio-teal-soft text-sebavio-teal flex size-9 items-center justify-center rounded-full"
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
              <span className="text-sebavio-navy flex-1 text-sm font-semibold">
                {mod.title}
              </span>
              <span className="text-muted-foreground text-xs">À venir</span>
              <ChevronDown
                className={cn(
                  "text-muted-foreground size-4 transition-transform duration-200",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {open ? (
              <div
                id={panelId}
                className="text-muted-foreground px-4 pb-4 text-sm"
                role="region"
              >
                Cette section sera disponible prochainement.
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
