"use client";

import { useActionState } from "react";
import {
  addDocumentAction,
  deleteHistoryAction,
  type MaintenanceActionResult,
} from "@/features/maintenance/actions";
import { MAINTENANCE_DOCUMENT_TYPES } from "@/features/maintenance/constants";
import type { MaintenanceHistoryDto } from "@/features/maintenance/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";
import { useRouter } from "next/navigation";

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Props = {
  history: MaintenanceHistoryDto;
};

export function MaintenanceDetailActions({ history }: Props) {
  const router = useRouter();
  const [docState, docAction, docPending] = useActionState(
    addDocumentAction.bind(null, history.id),
    undefined as MaintenanceActionResult | undefined,
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-3">
        <h2 className="text-sm font-medium">Documents</h2>
        {history.documents && history.documents.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {history.documents.map((d) => (
              <li key={d.id}>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {d.documentType}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Aucun document.</p>
        )}

        <form action={docAction} className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="doc-type" label="Type" required>
            <select
              id="doc-type"
              name="documentType"
              className={selectClassName}
              defaultValue="Invoice"
              required
            >
              {MAINTENANCE_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="doc-url" label="URL" required>
            <Input id="doc-url" name="fileUrl" type="url" required />
          </FormField>
          {docState && !docState.ok ? (
            <p className="text-destructive text-sm sm:col-span-2" role="alert">
              {docState.message}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" disabled={docPending}>
              Ajouter un document
            </Button>
          </div>
        </form>
      </section>

      <form
        action={async () => {
          const result = await deleteHistoryAction(history.id);
          if (result.ok) {
            router.push("/dashboard/maintenance/history");
            router.refresh();
          }
        }}
      >
        <Button type="submit" variant="destructive">
          Supprimer (soft delete)
        </Button>
      </form>
    </div>
  );
}
