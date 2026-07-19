import Link from "next/link";
import type { AdminUserListItem } from "@/features/admin/types";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/constants";
import { StatusBadge } from "@/components/common";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

function statusVariant(
  status: string,
): "success" | "warning" | "error" | "neutral" {
  if (status === "active") return "success";
  if (status === "suspended") return "warning";
  return "neutral";
}

type Props = {
  items: AdminUserListItem[];
};

export function UsersTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucun utilisateur.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Courriel</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Véhicules</TableHead>
          <TableHead className="text-right">Voyages</TableHead>
          <TableHead>Inscription</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((u) => (
          <TableRow key={u.id}>
            <TableCell>
              <Link
                href={`/admin/users/${u.id}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {u.email}
              </Link>
              {u.firstName || u.lastName ? (
                <p className="text-muted-foreground text-xs">
                  {[u.firstName, u.lastName].filter(Boolean).join(" ")}
                </p>
              ) : null}
            </TableCell>
            <TableCell>{ROLE_LABELS[u.role] ?? u.role}</TableCell>
            <TableCell>
              <StatusBadge status={statusVariant(u.status)}>
                {STATUS_LABELS[u.status] ?? u.status}
              </StatusBadge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {u.vehicleCount}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {u.tripCount}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(u.createdAt).toLocaleDateString("fr-CA")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
