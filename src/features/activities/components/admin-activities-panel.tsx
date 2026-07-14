"use client";

import { useActionState } from "react";
import {
  createActivityAction,
  deleteActivityAction,
  type ActivitiesActionResult,
} from "@/features/activities/actions";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABELS,
  ACTIVITY_SEASONS,
  ACTIVITY_SEASON_LABELS,
} from "@/features/activities/constants";
import type { ActivityDto } from "@/features/activities/types";
import { FormField } from "@/components/common";
import { Badge, Button, Input } from "@/components/ui";

const initial: ActivitiesActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Props = {
  items: ActivityDto[];
};

export function AdminActivitiesPanel({ items }: Props) {
  const [createState, createAction, createPending] = useActionState(
    createActivityAction,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteActivityAction,
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
          <p className="text-muted-foreground text-sm">Aucune activité.</p>
        ) : (
          <ul className="divide-border divide-y rounded-lg border">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {a.name}
                    <Badge variant="secondary">
                      {ACTIVITY_KIND_LABELS[
                        a.kind as keyof typeof ACTIVITY_KIND_LABELS
                      ] ?? a.kind}
                    </Badge>
                    {a.source === "seed-dev" ? (
                      <Badge variant="secondary">seed-dev</Badge>
                    ) : null}
                    {a.archived ? (
                      <Badge variant="outline">archivé</Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground">
                    {[a.city, a.region].filter(Boolean).join(", ") ||
                      `${a.latitude}, ${a.longitude}`}
                  </p>
                </div>
                {!a.archived ? (
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={a.id} />
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
        <h3 className="font-medium">Ajouter une activité / POI</h3>
        <form action={createAction} className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="act-name" label="Nom" required>
            <Input id="act-name" name="name" required maxLength={200} />
          </FormField>
          <FormField htmlFor="act-kind" label="Type">
            <select
              id="act-kind"
              name="kind"
              className={selectClassName}
              defaultValue="activity"
            >
              {ACTIVITY_KINDS.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_KIND_LABELS[t]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="act-cat" label="Catégorie">
            <select
              id="act-cat"
              name="category"
              className={selectClassName}
              defaultValue="autre"
            >
              {ACTIVITY_CATEGORIES.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_CATEGORY_LABELS[t]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="act-lat" label="Latitude" required>
            <Input id="act-lat" name="latitude" required placeholder="46.8" />
          </FormField>
          <FormField htmlFor="act-lng" label="Longitude" required>
            <Input id="act-lng" name="longitude" required placeholder="-71.2" />
          </FormField>
          <FormField htmlFor="act-city" label="Ville">
            <Input id="act-city" name="city" />
          </FormField>
          <FormField htmlFor="act-region" label="Région">
            <Input id="act-region" name="region" />
          </FormField>
          <FormField
            htmlFor="act-address"
            label="Adresse"
            className="sm:col-span-2"
          >
            <Input id="act-address" name="address" />
          </FormField>
          <FormField htmlFor="act-price" label="Prix indicatif ($)">
            <Input id="act-price" name="priceIndicative" />
          </FormField>
          <FormField htmlFor="act-dur" label="Durée estimée (min)">
            <Input id="act-dur" name="estimatedDurationMin" />
          </FormField>
          <fieldset className="sm:col-span-2">
            <legend className="text-muted-foreground mb-1 text-sm">
              Saisons
            </legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {ACTIVITY_SEASONS.map((s) => (
                <label key={s} className="flex items-center gap-1.5">
                  <input type="checkbox" name="season" value={s} />
                  {ACTIVITY_SEASON_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>
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
