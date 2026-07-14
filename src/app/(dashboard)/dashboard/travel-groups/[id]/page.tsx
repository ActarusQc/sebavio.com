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
  Button,
} from "@/components/ui";
import { TravelGroupDetailPanels } from "@/features/travel-groups/components";
import { getTravelGroupById } from "@/features/travel-groups/services";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ id: string }> };

export default async function TravelGroupDetailPage({ params }: PageProps) {
  const user = await requireActiveUser();
  const { id } = await params;

  let group;
  try {
    group = await getTravelGroupById(user.id, id);
  } catch (error) {
    if (isAppError(error) && error.code === "USR_003") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <PageHeader
        title={group.name}
        description="Composition du groupe et préférences."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href="/dashboard/travel-groups" />}
            >
              Retour
            </Button>
            <Button
              render={
                <Link href={`/dashboard/travel-groups/${group.id}/edit`} />
              }
            >
              Modifier
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Détail</CardTitle>
          <CardDescription>
            Membres et animaux = fiches descriptives (hard-delete).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TravelGroupDetailPanels group={group} />
        </CardContent>
      </Card>
    </div>
  );
}
