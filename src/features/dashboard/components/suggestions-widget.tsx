import Link from "next/link";
import { ArrowRight, Fuel, MapPin } from "lucide-react";
import type {
  DashboardSuggestion,
  DashboardSuggestionIcon,
} from "@/features/dashboard/types";
import { DashboardCard } from "./dashboard-card";

type SuggestionsWidgetProps = {
  suggestions: DashboardSuggestion[];
};

const ICONS: Record<DashboardSuggestionIcon, typeof MapPin> = {
  calendar: MapPin,
  "map-pin": MapPin,
  fuel: Fuel,
};

export function SuggestionsWidget({ suggestions }: SuggestionsWidgetProps) {
  if (suggestions.length === 0) {
    return (
      <DashboardCard title="Suggestions pour vous">
        <p className="text-client-text-muted flex flex-1 items-center justify-center py-6 text-center text-sm">
          Aucune suggestion pour le moment.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Suggestions pour vous">
      <ul className="flex flex-col gap-2">
        {suggestions.map((item) => {
          const Icon = ICONS[item.icon] ?? MapPin;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="border-client-border hover:bg-client-pale/60 group flex min-h-11 items-start gap-3 rounded-xl border bg-white/60 p-3 transition-all duration-200 hover:shadow-[var(--client-shadow)] dark:bg-white/5"
              >
                <span className="bg-client-turquoise text-client-petrol flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-client-night group-hover:text-client-petrol block text-sm font-semibold">
                    {item.title}
                  </span>
                  <span className="text-client-text-muted block text-xs leading-relaxed">
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  className="text-client-text-muted group-hover:text-client-petrol mt-1 size-4 shrink-0 transition-colors"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
