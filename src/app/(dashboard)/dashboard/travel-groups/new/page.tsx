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
import { TravelGroupForm } from "@/features/travel-groups/components";

export default async function NewTravelGroupPage() {
  await requireActiveUser();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Nouveau groupe"
        description="Le premier groupe devient automatiquement le groupe par défaut."
        actions={
          <Button
            variant="outline"
            render={<Link href="/dashboard/travel-groups" />}
          >
            Retour
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            Les membres et animaux s&apos;ajoutent ensuite sur la fiche du
            groupe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TravelGroupForm />
        </CardContent>
      </Card>
    </div>
  );
}
