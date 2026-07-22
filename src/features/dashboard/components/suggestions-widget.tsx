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
        <p className="text-client-text-muted flex flex-1 items-center justify-center py-6 text-center text-[0.9375rem]">
          Aucune suggestion pour le moment.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Suggestions pour vous">
      <ul className="flex flex-col gap-3">
        {suggestions.map((item) => {
          const Icon = ICONS[item.icon] ?? MapPin;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="border-client-border bg-client-surface-strong hover:bg-client-pale group flex min-h-12 items-start gap-3.5 rounded-xl border p-3.5 transition-all duration-200 hover:shadow-[var(--client-shadow)]"
              >
                <span className="bg-sebavio-blue-100 text-sebavio-navy flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-[1.125rem]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="text-client-text group-hover:text-sebavio-slate block text-[0.9375rem] font-semibold">
                    {item.title}
                  </span>
                  <span className="text-client-text-muted block text-sm leading-relaxed">
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  className="text-sebavio-gold group-hover:text-sebavio-gold-hover mt-1 size-5 shrink-0 transition-colors"
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
