import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { PaymentListItem } from "@/features/billing/types";
import { BillingStatusBadge } from "@/features/billing/components/billing-status-badge";
import { StripeModeBadge } from "@/features/billing/components/stripe-mode-badge";
import { RefundDialog } from "@/features/billing/components/refund-dialog";
import { formatMoneyCents } from "@/features/billing/lib/format";

type Props = {
  items: PaymentListItem[];
  canRefund: boolean;
  isLive: boolean;
};

export function PaymentsTable({ items, canRefund, isLive }: Props) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucun paiement.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Moyen</TableHead>
          <TableHead>Mode</TableHead>
          <TableHead>Remboursé</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link
                href={`/admin/users/${row.userId}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {row.userEmail}
              </Link>
              {row.failureMessageSafe ? (
                <p className="text-destructive text-xs">
                  {row.failureMessageSafe}
                </p>
              ) : null}
            </TableCell>
            <TableCell className="text-sm tabular-nums">
              {formatMoneyCents(row.amount, row.currency)}
            </TableCell>
            <TableCell>
              <BillingStatusBadge kind="payment" status={row.status} />
            </TableCell>
            <TableCell className="text-xs">
              {row.paymentMethodType ?? "—"}
              {row.cardLast4 ? (
                <span className="text-muted-foreground">
                  {" "}
                  {row.cardBrand} ••{row.cardLast4}
                </span>
              ) : null}
            </TableCell>
            <TableCell>
              <StripeModeBadge mode={row.stripeMode} />
            </TableCell>
            <TableCell className="text-xs tabular-nums">
              {row.amountRefunded > 0
                ? formatMoneyCents(row.amountRefunded, row.currency)
                : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(row.paidAt ?? row.createdAt).toLocaleString("fr-CA")}
            </TableCell>
            <TableCell>
              {canRefund && row.refundableAmount > 0 ? (
                <RefundDialog payment={row} isLive={isLive} />
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
