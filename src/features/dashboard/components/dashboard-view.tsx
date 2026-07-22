import type { DashboardData } from "@/features/dashboard/types";
import { DashboardHero } from "./dashboard-hero";
import { WeatherWidget } from "./weather-widget";
import { NextTripWidget } from "./next-trip-widget";
import { QuickStatsWidget } from "./quick-stats-widget";
import { RecentTripsWidget } from "./recent-trips-widget";
import { SuggestionsWidget } from "./suggestions-widget";
import { AiPlannerCard } from "./ai-planner-card";
import { DashboardQuote } from "./dashboard-quote";

type DashboardViewProps = {
  data: DashboardData;
};

export function DashboardView({ data }: DashboardViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <DashboardHero firstName={data.greetingFirstName} />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <WeatherWidget weather={data.weather} />
        <NextTripWidget trip={data.nextTrip} />
        <QuickStatsWidget stats={data.stats} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <RecentTripsWidget trips={data.recentTrips} />
        <SuggestionsWidget suggestions={data.suggestions} />
        <AiPlannerCard />
      </div>

      <DashboardQuote />
    </div>
  );
}
