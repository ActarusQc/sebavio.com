import Link from "next/link";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { TripsList } from "@/features/trips/components";
import { listTrips } from "@/features/trips/services";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Mes voyages"
        description="Planifiez et suivez vos itinéraires (adresses en texte — cartes plus tard)."
        actions={
          <Button render={<Link href="/dashboard/trips/new" />}>
            Nouveau voyage
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste</CardTitle>
          <CardDescription>
            Isolation stricte : seuls vos voyages sont visibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TripsList result={result} />
        </CardContent>
      </Card>
    </div>
  );
}
