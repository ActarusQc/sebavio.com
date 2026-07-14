import type { AdminAuditLogItem } from "@/features/admin/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

type Props = {
  items: AdminAuditLogItem[];
};

function previewJson(value: unknown): string {
  if (value == null) return "—";
  try {
    const s = JSON.stringify(value);
    return s.length > 80 ? `${s.slice(0, 77)}…` : s;
  } catch {
    return "—";
  }
}

export function AuditTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune entrée d&apos;audit.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Acteur</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Entité</TableHead>
          <TableHead>Avant → Après</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
              {new Date(row.createdAt).toLocaleString("fr-CA")}
            </TableCell>
            <TableCell className="text-sm">
              {row.userEmail ?? row.userId ?? "—"}
            </TableCell>
            <TableCell className="text-sm font-medium">{row.action}</TableCell>
            <TableCell className="text-sm">
              {row.entity}
              {row.entityId ? (
                <span className="text-muted-foreground block text-xs">
                  {row.entityId.slice(0, 8)}…
                </span>
              ) : null}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate font-mono text-xs">
              {previewJson(row.oldValue)} → {previewJson(row.newValue)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
