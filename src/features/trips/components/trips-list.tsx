"use client";

import Image from "next/image";
import Link from "next/link";
import type { PaginatedTrips } from "@/features/trips/types";
import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui";
import { BRAND_ASSETS } from "@/features/marketing";
import { TripCardsList } from "./trip-card";

type TripsListProps = {
  result: PaginatedTrips;
};

export function TripsList({ result }: TripsListProps) {
  if (result.items.length === 0) {
    return (
      <EmptyState
        title="Votre première aventure commence ici"
        description="Créez un voyage pour planifier l’itinéraire, le véhicule et le budget — Sebavio guide votre route."
        icon={
          <Image
            src={BRAND_ASSETS.icons.itineraires.teal}
            alt=""
            width={32}
            height={32}
          />
        }
        action={
          <Button size="lg" render={<Link href="/dashboard/trips/new" />}>
            Nouveau voyage
          </Button>
        }
      />
    );
  }

  return <TripCardsList trips={result.items} />;
}
