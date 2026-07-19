import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { UserDetailPanel } from "@/features/admin/components";
import { getAdminUserById } from "@/features/admin/services";

type Params = Promise<{ userId: string }>;

export default async function AdminUserDetailPage({
  params,
}: {
  params: Params;
}) {
  const actor = await requirePermission("users.read");
  const { userId } = await params;

  let user;
  try {
    user = await getAdminUserById(userId);
  } catch (error) {
    if (isAppError(error) && error.code === "ADM_003") notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user.email}
        description="Détail du compte — aucune donnée sensible (hash mot de passe exclus)."
        actions={
          <Button variant="outline" render={<Link href="/admin/users" />}>
            Retour à la liste
          </Button>
        }
      />
      <UserDetailPanel user={user} actorRole={actor.role} actorId={actor.id} />
    </div>
  );
}
