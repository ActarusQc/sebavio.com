import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActiveUser } from "@/features/auth";
import { AppPageHero } from "@/components/common";
import { Button } from "@/components/ui";
import { TripsList } from "@/features/trips/components";
import { listTrips } from "@/features/trips/services";
import { BRAND_ASSETS } from "@/features/marketing";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireActiveUser();
  const params = await searchParams;

  const query: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    query[key] = Array.isArray(value) ? value[0] : value;
  }

  const result = await listTrips(user.id, query);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AppPageHero
        variant="trips"
        title="Mes voyages"
        description="Planifiez et suivez vos itinéraires — l’étoile qui guide votre route."
        breadcrumb={
          <span className="inline-flex items-center gap-2">
            <Image
              src={BRAND_ASSETS.icons.itineraires.teal}
              alt=""
              width={16}
              height={16}
              className="opacity-80"
            />
            Espace client · Voyages
          </span>
        }
        actions={
          <Button size="lg" render={<Link href="/dashboard/trips/new" />}>
            <Plus data-icon="inline-start" />
            Nouveau voyage
          </Button>
        }
      />

      <TripsList result={result} />
    </div>
  );
}
