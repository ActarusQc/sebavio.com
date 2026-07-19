import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { SubscriptionListItem } from "@/features/billing/types";
import { BillingStatusBadge } from "@/features/billing/components/billing-status-badge";
import { StripeModeBadge } from "@/features/billing/components/stripe-mode-badge";
import { SubscriptionActionsDialog } from "@/features/billing/components/subscription-actions-dialog";
import {
  billingIntervalLabel,
  formatMoneyCents,
} from "@/features/billing/lib/format";

type Props = {
  items: SubscriptionListItem[];
  canCancel: boolean;
  canResume: boolean;
  isLive: boolean;
};

export function SubscriptionsTable({
  items,
  canCancel,
  canResume,
  isLive,
}: Props) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucun abonnement.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Produit / prix</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Mode</TableHead>
          <TableHead>Période</TableHead>
          <TableHead>Annulation</TableHead>
          <TableHead>Sync</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link
                href={`/admin/subscriptions/${row.id}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {row.userEmail}
              </Link>
              {row.userName ? (
                <p className="text-muted-foreground text-xs">{row.userName}</p>
              ) : null}
            </TableCell>
            <TableCell>
              <BillingStatusBadge kind="subscription" status={row.status} />
            </TableCell>
            <TableCell className="font-mono text-xs">
              {row.stripeProductId ?? "—"}
              {row.stripePriceId ? (
                <p className="text-muted-foreground">{row.stripePriceId}</p>
              ) : null}
            </TableCell>
            <TableCell className="text-sm tabular-nums">
              {formatMoneyCents(row.unitAmount, row.currency)}
              <span className="text-muted-foreground ml-1 text-xs">
                / {billingIntervalLabel(row.billingInterval)}
              </span>
            </TableCell>
            <TableCell>
              <StripeModeBadge mode={row.stripeMode} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {row.currentPeriodEnd
                ? new Date(row.currentPeriodEnd).toLocaleDateString("fr-CA")
                : "—"}
            </TableCell>
            <TableCell className="text-xs">
              {row.cancelAtPeriodEnd ? "Fin de période" : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {row.lastSyncedAt
                ? new Date(row.lastSyncedAt).toLocaleString("fr-CA")
                : "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/subscriptions/${row.id}`}
                  className="text-sm font-medium underline-offset-2 hover:underline"
                >
                  Voir
                </Link>
                {(canCancel || canResume) &&
                (canCancel || row.cancelAtPeriodEnd) ? (
                  <SubscriptionActionsDialog
                    subscription={row}
                    canCancel={canCancel}
                    canResume={canResume}
                    isLive={isLive}
                  />
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
