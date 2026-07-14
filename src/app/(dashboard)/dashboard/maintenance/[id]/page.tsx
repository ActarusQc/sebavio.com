import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { MaintenanceDetailActions } from "@/features/maintenance/components";
import { getHistoryById } from "@/features/maintenance/services";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ id: string }> };

export default async function MaintenanceDetailPage({ params }: PageProps) {
  const user = await requireActiveUser();
  const { id } = await params;

  let history;
  try {
    history = await getHistoryById(user.id, id);
  } catch (error) {
    if (isAppError(error) && error.code === "MNT_001") notFound();
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/dashboard/maintenance/history"
          className="text-muted-foreground mb-3 inline-block text-sm hover:underline"
        >
          ← Historique
        </Link>
        <PageHeader
          title={history.templateTitle ?? "Entretien"}
          description={`${history.performedDate} · ${history.performedOdometer} km`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail</CardTitle>
          <CardDescription>
            {history.provider ? `Prestataire : ${history.provider}` : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Coût :{" "}
            {history.cost ? `${history.cost} ${history.currency ?? ""}` : "—"}
          </p>
          {history.notes ? <p>Notes : {history.notes}</p> : null}
          <MaintenanceDetailActions history={history} />
        </CardContent>
      </Card>
    </div>
  );
}
