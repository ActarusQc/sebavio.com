import Link from "next/link";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { StripeModeBadge } from "@/features/billing";
import { SyncPlansDialog } from "@/features/plans/components/sync-plans-dialog";

type Props = {
  stripeMode: string;
  canManage: boolean;
};

export function PlansPageHeader({ stripeMode, canManage }: Props) {
  return (
    <PageHeader
      title="Forfaits"
      description="Gestion des forfaits Sebavio, prix et entitlements (mode Stripe courant)."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StripeModeBadge mode={stripeMode} />
          {canManage ? (
            <Button render={<Link href="/admin/plans/new" />}>
              Créer un forfait
            </Button>
          ) : null}
          <SyncPlansDialog canManage={canManage} />
        </div>
      }
    />
  );
}
