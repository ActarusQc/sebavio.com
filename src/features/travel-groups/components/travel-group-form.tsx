"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createTravelGroupAction,
  updateTravelGroupAction,
  type TravelGroupsActionResult,
} from "@/features/travel-groups/actions";
import type { TravelGroupDto } from "@/features/travel-groups/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: TravelGroupsActionResult | undefined = undefined;

type TravelGroupFormProps = {
  group?: TravelGroupDto;
};

export function TravelGroupForm({ group }: TravelGroupFormProps) {
  const router = useRouter();
  const isEdit = Boolean(group);
  const action = isEdit ? updateTravelGroupAction : createTravelGroupAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok && state.id && !isEdit) {
      router.push(`/dashboard/travel-groups/${state.id}`);
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {group ? <input type="hidden" name="id" value={group.id} /> : null}

      <FormField
        htmlFor="group-name"
        label="Nom du groupe"
        required
        className="sm:col-span-2"
      >
        <Input
          id="group-name"
          name="name"
          required
          maxLength={150}
          defaultValue={group?.name ?? ""}
          placeholder="Famille, couple, solo…"
        />
      </FormField>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="defaultGroup"
          value="true"
          defaultChecked={group?.defaultGroup ?? false}
        />
        Groupe par défaut
      </label>

      {state?.ok === false && (
        <p className="text-destructive text-sm sm:col-span-2" role="alert">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-700 sm:col-span-2" role="status">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Enregistrement…"
            : isEdit
              ? "Enregistrer"
              : "Créer le groupe"}
        </Button>
      </div>
    </form>
  );
}
