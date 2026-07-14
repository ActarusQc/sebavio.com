"use client";

import { useActionState } from "react";
import {
  importCatalogAction,
  type CatalogActionResult,
} from "@/features/vehicle-catalog/actions";
import { FormField } from "@/components/common";
import { Button, Textarea } from "@/components/ui";
import {
  IMPORT_MAX_BYTES,
  IMPORT_MAX_LINES,
} from "@/features/vehicle-catalog/constants";

const initial: CatalogActionResult | undefined = undefined;

const example = `{
  "manufacturers": [
    { "name": "Exemple Motors", "countryCode": "CA", "active": true }
  ],
  "models": [
    {
      "manufacturerName": "Exemple Motors",
      "category": "ClassC",
      "modelName": "Voyager",
      "trim": "LE",
      "year": 2024,
      "fuelType": "Gasoline"
    }
  ]
}`;

export function CatalogImportForm() {
  const [state, formAction, pending] = useActionState(
    importCatalogAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Import JSON — max {IMPORT_MAX_LINES} lignes et {IMPORT_MAX_BYTES}{" "}
        octets. Validation ligne par ligne avec rapport d&apos;erreurs.
      </p>
      <FormField htmlFor="import-payload" label="Payload JSON" required>
        <Textarea
          id="import-payload"
          name="payload"
          required
          rows={12}
          defaultValue={example}
          className="font-mono text-xs"
        />
      </FormField>
      {state?.ok === false ? (
        <p className="text-destructive text-sm">{state.message}</p>
      ) : null}
      {state?.ok === true ? (
        <div className="space-y-2 text-sm">
          <p className="text-green-700">{state.message}</p>
          {state.importReport && state.importReport.rejected.length > 0 ? (
            <ul className="text-muted-foreground list-inside list-disc">
              {state.importReport.rejected.map((err) => (
                <li key={`${err.section}-${err.line}`}>
                  {err.section} L{err.line} : {err.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Import…" : "Importer"}
      </Button>
    </form>
  );
}
