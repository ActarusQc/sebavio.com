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
import { TravelGroupsList } from "@/features/travel-groups/components";
import { listTravelGroups } from "@/features/travel-groups/services";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TravelGroupsPage({
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

  const result = await listTravelGroups(user.id, query);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Groupes de voyage"
        description="Qui voyage avec vous : membres, animaux et préférences (fiches personnelles)."
        actions={
          <Button render={<Link href="/dashboard/travel-groups/new" />}>
            Créer un groupe
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste</CardTitle>
          <CardDescription>
            Isolation stricte par propriétaire. Soft-delete si aucun voyage
            actif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TravelGroupsList result={result} />
        </CardContent>
      </Card>
    </div>
  );
}
