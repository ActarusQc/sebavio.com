import { requireAdminUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { AdminCampingsPanel } from "@/features/campings/components";
import { listCampgroundsAdmin } from "@/features/campings/services";

export default async function AdminCampingsPage() {
  await requireAdminUser();
  const { items } = await listCampgroundsAdmin({
    page: 1,
    pageSize: 100,
    includeDeleted: true,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Campings"
        description="Répertoire local — seed-dev / saisie admin."
      />
      <Card>
        <CardHeader>
          <CardTitle>Gestion</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminCampingsPanel items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
