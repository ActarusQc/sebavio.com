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
  const continueTripHref =
    data.nextTrip?.status === "in_progress"
      ? `/dashboard/trips/${data.nextTrip.id}`
      : null;

  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <DashboardHero
        firstName={data.greetingFirstName}
        continueTripHref={continueTripHref}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[minmax(280px,0.9fr)_minmax(360px,1.2fr)_minmax(300px,1fr)] xl:gap-6">
        <WeatherWidget weather={data.weather} />
        <NextTripWidget trip={data.nextTrip} />
        <QuickStatsWidget stats={data.stats} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        <RecentTripsWidget trips={data.recentTrips} />
        <SuggestionsWidget suggestions={data.suggestions} />
        <AiPlannerCard />
      </div>

      <DashboardQuote />
    </div>
  );
}
