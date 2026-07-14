"use client";

import { useActionState } from "react";
import {
  createCampgroundAction,
  deleteCampgroundAction,
  type CampingsActionResult,
} from "@/features/campings/actions";
import {
  CAMPGROUND_TYPES,
  CAMPGROUND_TYPE_LABELS,
} from "@/features/campings/constants";
import type { CampgroundDto } from "@/features/campings/types";
import { FormField } from "@/components/common";
import { Badge, Button, Input } from "@/components/ui";

const initial: CampingsActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Props = {
  items: CampgroundDto[];
};

export function AdminCampingsPanel({ items }: Props) {
  const [createState, createAction, createPending] = useActionState(
    createCampgroundAction,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCampgroundAction,
    initial,
  );

  const feedback =
    (createState?.ok === false && createState.message) ||
    (deleteState?.ok === false && deleteState.message) ||
    null;
  const success =
    (createState?.ok && createState.message) ||
    (deleteState?.ok && deleteState.message) ||
    null;

  return (
    <div className="flex flex-col gap-8">
      {feedback ? <p className="text-destructive text-sm">{feedback}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </p>
      ) : null}

      <section className="space-y-3">
        <h3 className="font-medium">Répertoire ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun camping.</p>
        ) : (
          <ul className="divide-border divide-y rounded-lg border">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {c.name}
                    {c.source === "seed-dev" ? (
                      <Badge variant="secondary">seed-dev</Badge>
                    ) : null}
                    {c.archived ? (
                      <Badge variant="outline">archivé</Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground">
                    {[c.city, c.region].filter(Boolean).join(", ") ||
                      `${c.latitude}, ${c.longitude}`}
                  </p>
                </div>
                {!c.archived ? (
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      disabled={deletePending}
                    >
                      Archiver
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Ajouter un camping</h3>
        <form action={createAction} className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="cg-name" label="Nom" required>
            <Input id="cg-name" name="name" required maxLength={200} />
          </FormField>
          <FormField htmlFor="cg-type" label="Type">
            <select
              id="cg-type"
              name="campgroundType"
              className={selectClassName}
              defaultValue="campground"
            >
              {CAMPGROUND_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CAMPGROUND_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="cg-lat" label="Latitude" required>
            <Input id="cg-lat" name="latitude" required placeholder="46.8" />
          </FormField>
          <FormField htmlFor="cg-lng" label="Longitude" required>
            <Input id="cg-lng" name="longitude" required placeholder="-71.2" />
          </FormField>
          <FormField htmlFor="cg-city" label="Ville">
            <Input id="cg-city" name="city" />
          </FormField>
          <FormField htmlFor="cg-region" label="Région">
            <Input id="cg-region" name="region" />
          </FormField>
          <FormField
            htmlFor="cg-address"
            label="Adresse"
            className="sm:col-span-2"
          >
            <Input id="cg-address" name="address" />
          </FormField>
          <FormField htmlFor="cg-max" label="Longueur max (m)">
            <Input id="cg-max" name="maxLengthM" />
          </FormField>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" name="petFriendly" />
            Animaux acceptés
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={createPending}>
              Créer
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
