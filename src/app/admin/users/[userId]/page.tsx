import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { UserDetailPanel } from "@/features/admin/components";
import { resolveAdminEnvironment } from "@/features/admin/lib/environment";
import {
  getAdminUserById,
  listAdminUserNotes,
} from "@/features/admin/services";
import {
  UserBillingSection,
  getUserBillingSummary,
  isStripeLiveMode,
} from "@/features/billing";

type Params = Promise<{ userId: string }>;

export default async function AdminUserDetailPage({
  params,
}: {
  params: Params;
}) {
  const actor = await requirePermission("users.read");
  const { userId } = await params;
  const isProduction = resolveAdminEnvironment() === "production";

  let user;
  try {
    user = await getAdminUserById(userId);
  } catch (error) {
    if (isAppError(error) && error.code === "ADM_003") notFound();
    throw error;
  }

  const notes = hasPermission(actor.role, "users.notes")
    ? await listAdminUserNotes(userId, actor)
    : [];

  const billingSummary = hasPermission(actor.role, "billing.read")
    ? await getUserBillingSummary(userId)
    : null;

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
      <UserDetailPanel
        user={user}
        notes={notes}
        actorRole={actor.role}
        actorId={actor.id}
        isProduction={isProduction}
      />
      {billingSummary ? (
        <UserBillingSection
          summary={billingSummary}
          userId={userId}
          actorRole={actor.role}
          isLive={isStripeLiveMode()}
        />
      ) : null}
    </div>
  );
}
