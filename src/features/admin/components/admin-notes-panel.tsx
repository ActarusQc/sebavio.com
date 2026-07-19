"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { UserRole } from "@/lib/constants";
import { hasPermission } from "@/lib/rbac";
import type { AdminUserNoteItem } from "@/features/admin/types";
import {
  NOTE_CATEGORY_LABELS,
  NOTE_IMPORTANCE_LABELS,
} from "@/features/admin/constants";
import {
  ADMIN_NOTE_CATEGORIES,
  ADMIN_NOTE_IMPORTANCES,
} from "@/features/admin/schemas";
import {
  createNoteAction,
  deleteNoteAction,
  type AdminActionResult,
} from "@/features/admin/actions";
import { Button, Textarea } from "@/components/ui";

const initial: AdminActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full max-w-xs rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Props = {
  userId: string;
  notes: AdminUserNoteItem[];
  actorRole: UserRole;
};

export function AdminNotesPanel({ userId, notes, actorRole }: Props) {
  const canCreate = hasPermission(actorRole, "users.notes.create");
  const canManage = hasPermission(actorRole, "users.notes");

  const [createState, createAction, createPending] = useActionState(
    createNoteAction,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteNoteAction,
    initial,
  );

  useEffect(() => {
    if (createState?.ok) toast.success(createState.message);
    else if (createState?.ok === false) toast.error(createState.message);
  }, [createState]);

  useEffect(() => {
    if (deleteState?.ok) toast.success(deleteState.message);
    else if (deleteState?.ok === false) toast.error(deleteState.message);
  }, [deleteState]);

  if (!canManage && !canCreate) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sebavio-navy text-base font-semibold">
        Notes internes
      </h2>
      <p className="text-muted-foreground text-sm">
        Invisibles pour l&apos;utilisateur. Réservées au soutien administratif.
      </p>

      {notes.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune note.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="border-border flex flex-col gap-2 rounded-lg border p-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">
                  {NOTE_CATEGORY_LABELS[note.category] ?? note.category}
                </span>
                <span className="text-muted-foreground">·</span>
                <span>
                  {NOTE_IMPORTANCE_LABELS[note.importance] ?? note.importance}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {note.authorEmail ?? "Auteur inconnu"} —{" "}
                  {new Date(note.createdAt).toLocaleString("fr-CA")}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{note.content}</p>
              {canManage ? (
                <form action={deleteAction} className="self-start">
                  <input type="hidden" name="noteId" value={note.id} />
                  <input type="hidden" name="userId" value={userId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={deletePending}
                    className="text-destructive"
                  >
                    Supprimer
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canCreate ? (
        <form action={createAction} className="flex max-w-xl flex-col gap-3">
          <input type="hidden" name="userId" value={userId} />
          <p
            role="note"
            className="border-warning/40 bg-warning/10 text-warning-foreground rounded-lg border px-3 py-2 text-sm"
          >
            N&apos;inscrivez jamais de mot de passe, de clé API ou de donnée
            bancaire.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="note-category" className="text-sm font-medium">
                Catégorie
              </label>
              <select
                id="note-category"
                name="category"
                className={selectClassName}
                defaultValue="general"
              >
                {ADMIN_NOTE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {NOTE_CATEGORY_LABELS[c] ?? c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="note-importance" className="text-sm font-medium">
                Importance
              </label>
              <select
                id="note-importance"
                name="importance"
                className={selectClassName}
                defaultValue="normal"
              >
                {ADMIN_NOTE_IMPORTANCES.map((i) => (
                  <option key={i} value={i}>
                    {NOTE_IMPORTANCE_LABELS[i] ?? i}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="note-content" className="text-sm font-medium">
              Contenu
            </label>
            <Textarea
              id="note-content"
              name="content"
              required
              maxLength={5000}
              rows={4}
              placeholder="Note de soutien…"
            />
          </div>
          <Button type="submit" disabled={createPending} className="self-start">
            {createPending ? "Enregistrement…" : "Ajouter la note"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
