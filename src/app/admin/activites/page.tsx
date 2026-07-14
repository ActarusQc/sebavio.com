import { requireAdminUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { AdminActivitiesPanel } from "@/features/activities/components";
import { listActivitiesAdmin } from "@/features/activities/services";

export default async function AdminActivitiesPage() {
  await requireAdminUser();
  const { items } = await listActivitiesAdmin({
    page: 1,
    pageSize: 100,
    includeDeleted: true,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Activités & points d'intérêt"
        description="Répertoire local — seed-dev / saisie admin."
      />
      <Card>
        <CardHeader>
          <CardTitle>Gestion</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminActivitiesPanel items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
