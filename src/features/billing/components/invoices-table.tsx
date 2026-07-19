import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { InvoiceListItem } from "@/features/billing/types";
import { BillingStatusBadge } from "@/features/billing/components/billing-status-badge";
import { StripeModeBadge } from "@/features/billing/components/stripe-mode-badge";
import { formatMoneyCents } from "@/features/billing/lib/format";

type Props = {
  items: InvoiceListItem[];
};

export function InvoicesTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucune facture.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Payé</TableHead>
          <TableHead>Mode</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Liens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-xs">
              {row.number ?? row.stripeInvoiceId}
            </TableCell>
            <TableCell>
              <Link
                href={`/admin/users/${row.userId}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {row.userEmail}
              </Link>
            </TableCell>
            <TableCell>
              <BillingStatusBadge kind="invoice" status={row.status} />
            </TableCell>
            <TableCell className="text-sm tabular-nums">
              {formatMoneyCents(row.total, row.currency)}
            </TableCell>
            <TableCell className="text-sm tabular-nums">
              {formatMoneyCents(row.amountPaid, row.currency)}
            </TableCell>
            <TableCell>
              <StripeModeBadge mode={row.stripeMode} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(row.createdAt).toLocaleDateString("fr-CA")}
            </TableCell>
            <TableCell className="space-x-2 text-xs">
              {row.hostedInvoiceUrl ? (
                <a
                  href={row.hostedInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  Facture
                </a>
              ) : null}
              {row.invoicePdfUrl ? (
                <a
                  href={row.invoicePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  PDF
                </a>
              ) : null}
              {!row.hostedInvoiceUrl && !row.invoicePdfUrl ? "—" : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
