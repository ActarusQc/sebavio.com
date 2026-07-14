import Link from "next/link";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { HistoryList } from "@/features/maintenance/components";
import { listHistory } from "@/features/maintenance/services";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MaintenanceHistoryPage({
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

  const result = await listHistory(user.id, query);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div>
        <Link
          href="/dashboard/maintenance"
          className="text-muted-foreground mb-3 inline-block text-sm hover:underline"
        >
          ← Entretien
        </Link>
        <PageHeader
          title="Historique"
          description="Interventions réalisées (soft delete conservant les documents)."
          actions={
            <Button render={<Link href="/dashboard/maintenance/new" />}>
              Ajouter
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {result.total} intervention{result.total === 1 ? "" : "s"}
          </CardTitle>
          <CardDescription>
            Page {result.page} · {result.pageSize} par page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryList items={result.items} />
        </CardContent>
      </Card>
    </div>
  );
}
