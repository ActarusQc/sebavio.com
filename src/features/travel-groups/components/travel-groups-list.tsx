"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteTravelGroupAction,
  setDefaultTravelGroupAction,
  type TravelGroupsActionResult,
} from "@/features/travel-groups/actions";
import type { PaginatedTravelGroups } from "@/features/travel-groups/types";
import { Badge, Button } from "@/components/ui";

const initial: TravelGroupsActionResult | undefined = undefined;

type TravelGroupsListProps = {
  result: PaginatedTravelGroups;
};

export function TravelGroupsList({ result }: TravelGroupsListProps) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTravelGroupAction,
    initial,
  );
  const [defaultState, defaultAction, defaultPending] = useActionState(
    setDefaultTravelGroupAction,
    initial,
  );

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground text-sm">
          Aucun groupe. Créez votre composition habituelle de voyageurs
          (adultes, enfants, animaux).
        </p>
        <Button render={<Link href="/dashboard/travel-groups/new" />}>
          Créer un groupe
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(deleteState?.ok === false || defaultState?.ok === false) && (
        <p className="text-destructive text-sm" role="alert">
          {deleteState?.ok === false
            ? deleteState.message
            : defaultState?.ok === false
              ? defaultState.message
              : null}
        </p>
      )}
      {(deleteState?.ok || defaultState?.ok) && (
        <p className="text-sm text-emerald-700" role="status">
          {deleteState?.ok
            ? deleteState.message
            : defaultState?.ok
              ? defaultState.message
              : null}
        </p>
      )}

      <ul className="divide-border divide-y rounded-lg border">
        {result.items.map((group) => (
          <li
            key={group.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/travel-groups/${group.id}`}
                  className="text-foreground font-medium hover:underline"
                >
                  {group.name}
                </Link>
                {group.defaultGroup ? (
                  <Badge variant="secondary">Par défaut</Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm">
                {group.memberCount} membre{group.memberCount > 1 ? "s" : ""}
                {" · "}
                {group.petCount} animal{group.petCount > 1 ? "aux" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/dashboard/travel-groups/${group.id}`} />}
              >
                Voir
              </Button>
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={`/dashboard/travel-groups/${group.id}/edit`} />
                }
              >
                Modifier
              </Button>
              {!group.defaultGroup ? (
                <form action={defaultAction}>
                  <input type="hidden" name="id" value={group.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={defaultPending}
                  >
                    Définir par défaut
                  </Button>
                </form>
              ) : null}
              <form action={deleteAction}>
                <input type="hidden" name="id" value={group.id} />
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={deletePending}
                >
                  Supprimer
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground text-xs">
        Page {result.page} / {result.totalPages} · {result.total} groupe
        {result.total > 1 ? "s" : ""}
      </p>
    </div>
  );
}
