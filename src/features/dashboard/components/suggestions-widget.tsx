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
        <p className="flex flex-1 items-center justify-center py-6 text-center text-[0.9375rem] text-white/60">
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
                className="group flex min-h-12 items-start gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08]"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(59,130,246,0.35),rgba(139,92,246,0.35))] text-[#c4b5fd]">
                  <Icon className="size-[1.125rem]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-[0.9375rem] font-semibold text-white group-hover:text-[#93c5fd]">
                    {item.title}
                  </span>
                  <span className="block text-sm leading-relaxed text-white/55">
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  className="mt-1 size-5 shrink-0 text-[#f0b64d] transition-transform group-hover:translate-x-0.5"
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
