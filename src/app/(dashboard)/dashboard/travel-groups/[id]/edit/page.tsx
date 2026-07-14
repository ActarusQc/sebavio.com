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
import { TravelGroupForm } from "@/features/travel-groups/components";
import { getTravelGroupById } from "@/features/travel-groups/services";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditTravelGroupPage({ params }: PageProps) {
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Modifier le groupe"
        description={group.name}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/dashboard/travel-groups/${group.id}`} />}
          >
            Retour
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>Nom et statut par défaut.</CardDescription>
        </CardHeader>
        <CardContent>
          <TravelGroupForm group={group} />
        </CardContent>
      </Card>
    </div>
  );
}
