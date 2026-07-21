"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { StatusBadge } from "@/components/common";
import { StripeModeBadge } from "@/features/billing/components/stripe-mode-badge";
import {
  PASS_GRANT_STATUS_LABELS,
  type PassGrantListItem,
  type PassGrantStatus,
} from "@/features/subscriptions/lib/pass-grant-constants";

function statusVariant(
  status: string,
): "success" | "warning" | "error" | "neutral" | "info" {
  if (status === "active") return "success";
  if (status === "pending_payment") return "info";
  if (status === "expired") return "warning";
  if (
    status === "revoked" ||
    status === "refunded" ||
    status === "payment_failed"
  )
    return "error";
  return "neutral";
}

function statusLabel(status: string): string {
  return PASS_GRANT_STATUS_LABELS[status as PassGrantStatus] ?? status;
}

type Props = {
  items: PassGrantListItem[];
};

export function PassesTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucun Pass.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Forfait</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Fenêtre</TableHead>
          <TableHead>Restant</TableHead>
          <TableHead>Mode</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link
                href={`/admin/passes/${row.id}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {row.userEmail}
              </Link>
              {row.userName ? (
                <p className="text-muted-foreground text-xs">{row.userName}</p>
              ) : null}
            </TableCell>
            <TableCell>
              <p className="text-sm">{row.planPublicName}</p>
              <p className="text-muted-foreground font-mono text-xs">
                {row.planInternalName}
              </p>
            </TableCell>
            <TableCell>
              <StatusBadge status={statusVariant(row.status)}>
                {statusLabel(row.status)}
              </StatusBadge>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(row.startsAt).toLocaleDateString("fr-CA")} →{" "}
              {new Date(row.endsAt).toLocaleDateString("fr-CA")}
            </TableCell>
            <TableCell className="text-sm tabular-nums">
              {row.status === "active" ? `${row.remainingDays} j` : "—"}
            </TableCell>
            <TableCell>
              <StripeModeBadge
                mode={row.stripeMode === "live" ? "live" : "test"}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
