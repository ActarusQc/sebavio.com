"use client";

import { useActionState } from "react";
import {
  addMemberAction,
  addPetAction,
  deleteMemberAction,
  deletePetAction,
  upsertPreferencesAction,
  type TravelGroupsActionResult,
} from "@/features/travel-groups/actions";
import {
  MOBILITY_LABELS,
  MOBILITY_LEVELS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_OPTIONS,
} from "@/features/travel-groups/constants";
import type { TravelGroupDetailDto } from "@/features/travel-groups/types";
import { FormField } from "@/components/common";
import { Badge, Button, Input } from "@/components/ui";

const initial: TravelGroupsActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type TravelGroupDetailPanelsProps = {
  group: TravelGroupDetailDto;
};

export function TravelGroupDetailPanels({
  group,
}: TravelGroupDetailPanelsProps) {
  const [memberState, memberAction, memberPending] = useActionState(
    addMemberAction,
    initial,
  );
  const [delMemberState, delMemberAction, delMemberPending] = useActionState(
    deleteMemberAction,
    initial,
  );
  const [petState, petAction, petPending] = useActionState(
    addPetAction,
    initial,
  );
  const [delPetState, delPetAction, delPetPending] = useActionState(
    deletePetAction,
    initial,
  );
  const [prefsState, prefsAction, prefsPending] = useActionState(
    upsertPreferencesAction,
    initial,
  );

  const feedback =
    (memberState?.ok === false && memberState.message) ||
    (delMemberState?.ok === false && delMemberState.message) ||
    (petState?.ok === false && petState.message) ||
    (delPetState?.ok === false && delPetState.message) ||
    (prefsState?.ok === false && prefsState.message) ||
    null;

  const success =
    (memberState?.ok && memberState.message) ||
    (delMemberState?.ok && delMemberState.message) ||
    (petState?.ok && petState.message) ||
    (delPetState?.ok && delPetState.message) ||
    (prefsState?.ok && prefsState.message) ||
    null;

  const prefs = group.preferences;

  return (
    <div className="flex flex-col gap-8">
      {feedback ? (
        <p className="text-destructive text-sm" role="alert">
          {feedback}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-700" role="status">
          {success}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{group.name}</h2>
          {group.defaultGroup ? (
            <Badge variant="secondary">Par défaut</Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          Fiches descriptives (pas de comptes utilisateurs). Partage
          multi-comptes = v3.0.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium">Membres</h3>
        {group.members.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun membre.</p>
        ) : (
          <ul className="divide-border divide-y rounded-lg border">
            {group.members.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{m.firstName}</p>
                  <p className="text-muted-foreground text-sm">
                    {m.relationship
                      ? (RELATIONSHIP_LABELS[
                          m.relationship as keyof typeof RELATIONSHIP_LABELS
                        ] ?? m.relationship)
                      : "—"}
                    {m.birthDate ? ` · né(e) ${m.birthDate}` : ""}
                    {m.mobilityLevel
                      ? ` · ${MOBILITY_LABELS[m.mobilityLevel as keyof typeof MOBILITY_LABELS] ?? m.mobilityLevel}`
                      : ""}
                  </p>
                </div>
                <form action={delMemberAction}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="memberId" value={m.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={delMemberPending}
                  >
                    Supprimer
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={memberAction}
          className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="groupId" value={group.id} />
          <FormField htmlFor="mem-first" label="Prénom" required>
            <Input id="mem-first" name="firstName" required maxLength={100} />
          </FormField>
          <FormField htmlFor="mem-birth" label="Date de naissance">
            <Input id="mem-birth" name="birthDate" type="date" />
          </FormField>
          <FormField htmlFor="mem-rel" label="Lien">
            <select
              id="mem-rel"
              name="relationship"
              className={selectClassName}
              defaultValue=""
            >
              <option value="">—</option>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {RELATIONSHIP_LABELS[r]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="mem-mob" label="Mobilité">
            <select
              id="mem-mob"
              name="mobilityLevel"
              className={selectClassName}
              defaultValue=""
            >
              <option value="">—</option>
              {MOBILITY_LEVELS.map((m) => (
                <option key={m} value={m}>
                  {MOBILITY_LABELS[m]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            htmlFor="mem-needs"
            label="Besoins particuliers"
            className="sm:col-span-2"
          >
            <Input id="mem-needs" name="specialNeeds" />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={memberPending}>
              Ajouter un membre
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium">Animaux</h3>
        {group.pets.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun animal.</p>
        ) : (
          <ul className="divide-border divide-y rounded-lg border">
            {group.pets.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {[
                      p.species,
                      p.breed,
                      p.weightKg ? `${p.weightKg} kg` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <form action={delPetAction}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="petId" value={p.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={delPetPending}
                  >
                    Supprimer
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form
          action={petAction}
          className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="groupId" value={group.id} />
          <FormField htmlFor="pet-name" label="Nom" required>
            <Input id="pet-name" name="name" required maxLength={100} />
          </FormField>
          <FormField htmlFor="pet-species" label="Espèce">
            <Input id="pet-species" name="species" placeholder="Chien, chat…" />
          </FormField>
          <FormField htmlFor="pet-breed" label="Race">
            <Input id="pet-breed" name="breed" />
          </FormField>
          <FormField htmlFor="pet-weight" label="Poids (kg)">
            <Input
              id="pet-weight"
              name="weightKg"
              type="number"
              step="0.01"
              min="0.01"
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={petPending}>
              Ajouter un animal
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium">Préférences du groupe</h3>
        <form
          action={prefsAction}
          className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="groupId" value={group.id} />
          <FormField
            htmlFor="pref-drive"
            label="Max. heures de conduite / jour"
          >
            <Input
              id="pref-drive"
              name="maxDriveHours"
              type="number"
              step="0.5"
              min="0"
              defaultValue={prefs?.maxDriveHours ?? ""}
            />
          </FormField>
          <FormField htmlFor="pref-budget" label="Budget quotidien (CAD)">
            <Input
              id="pref-budget"
              name="dailyBudget"
              type="number"
              step="0.01"
              min="0"
              defaultValue={prefs?.dailyBudget ?? ""}
            />
          </FormField>
          <FormField
            htmlFor="pref-camp"
            label="Type de camping préféré"
            className="sm:col-span-2"
          >
            <Input
              id="pref-camp"
              name="preferredCampgroundType"
              defaultValue={prefs?.preferredCampgroundType ?? ""}
            />
          </FormField>
          <FormField
            htmlFor="pref-acts"
            label="Activités préférées (séparées par des virgules)"
            className="sm:col-span-2"
          >
            <Input
              id="pref-acts"
              name="preferredActivityTypes"
              defaultValue={prefs?.preferredActivityTypes?.join(", ") ?? ""}
            />
          </FormField>
          <FormField
            htmlFor="pref-food"
            label="Préférences alimentaires (virgules)"
            className="sm:col-span-2"
          >
            <Input
              id="pref-food"
              name="foodPreferences"
              defaultValue={prefs?.foodPreferences?.join(", ") ?? ""}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="avoidTolls"
              value="true"
              defaultChecked={prefs?.avoidTolls ?? false}
            />
            Éviter les péages
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="avoidFerries"
              value="true"
              defaultChecked={prefs?.avoidFerries ?? false}
            />
            Éviter les traversiers
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="accessibilityRequired"
              value="true"
              defaultChecked={prefs?.accessibilityRequired ?? false}
            />
            Accessibilité requise
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={prefsPending}>
              Enregistrer les préférences
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
