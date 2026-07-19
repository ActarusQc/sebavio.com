"use client";

import { useActionState } from "react";
import type { UserRole } from "@/lib/constants";
import type { AdminUserDetail } from "@/features/admin/types";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/constants";
import {
  changeUserRoleAction,
  reactivateUserAction,
  suspendUserAction,
  type AdminActionResult,
} from "@/features/admin/actions";
import { StatusBadge } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: AdminActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full max-w-xs rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Props = {
  user: AdminUserDetail;
  actorRole: UserRole;
  actorId: string;
};

export function UserDetailPanel({ user, actorRole, actorId }: Props) {
  const [suspendState, suspendAction, suspendPending] = useActionState(
    suspendUserAction,
    initial,
  );
  const [reactivateState, reactivateAction, reactivatePending] = useActionState(
    reactivateUserAction,
    initial,
  );
  const [roleState, roleAction, rolePending] = useActionState(
    changeUserRoleAction,
    initial,
  );

  const isSelf = actorId === user.id;
  const isSuperAdmin = actorRole === "super_admin";
  const canManageStaff = isSuperAdmin;
  const canManageMidStaff =
    actorRole === "admin" || actorRole === "super_admin";
  const targetIsPrivileged =
    user.role === "admin" || user.role === "super_admin";
  const canSuspendOrReactivate =
    !isSelf &&
    (user.role === "user" ||
      (canManageMidStaff && !targetIsPrivileged) ||
      (canManageStaff && targetIsPrivileged)) &&
    !(user.isLastActiveSuperAdmin && user.status === "active");

  const feedback =
    (suspendState?.ok === false && suspendState.message) ||
    (reactivateState?.ok === false && reactivateState.message) ||
    (roleState?.ok === false && roleState.message) ||
    null;
  const success =
    (suspendState?.ok && suspendState.message) ||
    (reactivateState?.ok && reactivateState.message) ||
    (roleState?.ok && roleState.message) ||
    null;

  return (
    <div className="flex flex-col gap-8">
      {user.isLastActiveSuperAdmin ? (
        <p
          role="status"
          className="border-warning/40 bg-warning/10 text-warning-foreground rounded-lg border px-3 py-2 text-sm"
        >
          Dernier super_admin actif — suspension et rétrogradation bloquées pour
          protéger le système.
        </p>
      ) : null}

      {feedback ? <p className="text-destructive text-sm">{feedback}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </p>
      ) : null}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Courriel</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Statut</dt>
          <dd>
            <StatusBadge
              status={
                user.status === "active"
                  ? "success"
                  : user.status === "suspended"
                    ? "warning"
                    : "neutral"
              }
            >
              {STATUS_LABELS[user.status] ?? user.status}
            </StatusBadge>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rôle</dt>
          <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Inscription</dt>
          <dd>{new Date(user.createdAt).toLocaleString("fr-CA")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dernière activité</dt>
          <dd>
            {user.lastActivityAt
              ? new Date(user.lastActivityAt).toLocaleString("fr-CA")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Courriel vérifié</dt>
          <dd>
            {user.emailVerified
              ? new Date(user.emailVerified).toLocaleString("fr-CA")
              : "Non"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Véhicules</dt>
          <dd className="tabular-nums">{user.vehicleCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Voyages</dt>
          <dd className="tabular-nums">{user.tripCount}</dd>
        </div>
      </dl>

      {user.status === "active" && canSuspendOrReactivate ? (
        <form action={suspendAction} className="flex max-w-md flex-col gap-3">
          <input type="hidden" name="userId" value={user.id} />
          <label className="text-sm font-medium" htmlFor="reason">
            Suspendre le compte
          </label>
          <Input
            id="reason"
            name="reason"
            placeholder="Motif (optionnel)"
            maxLength={500}
          />
          <Button type="submit" variant="destructive" disabled={suspendPending}>
            {suspendPending ? "Suspension…" : "Suspendre"}
          </Button>
        </form>
      ) : null}

      {user.status === "suspended" && canSuspendOrReactivate ? (
        <form action={reactivateAction}>
          <input type="hidden" name="userId" value={user.id} />
          <Button type="submit" disabled={reactivatePending}>
            {reactivatePending ? "Réactivation…" : "Réactiver"}
          </Button>
        </form>
      ) : null}

      {isSuperAdmin && !isSelf ? (
        <form action={roleAction} className="flex max-w-md flex-col gap-3">
          <input type="hidden" name="userId" value={user.id} />
          <label className="text-sm font-medium" htmlFor="role">
            Changer le rôle
          </label>
          <select
            id="role"
            name="role"
            className={selectClassName}
            defaultValue={user.role}
            disabled={user.isLastActiveSuperAdmin}
          >
            <option value="user">Utilisateur</option>
            <option value="support">Support</option>
            <option value="analyst">Analyste</option>
            <option value="billing_admin">Admin facturation</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </select>
          <Button
            type="submit"
            variant="outline"
            disabled={rolePending || user.isLastActiveSuperAdmin}
          >
            {rolePending ? "Mise à jour…" : "Enregistrer le rôle"}
          </Button>
        </form>
      ) : null}

      {isSelf ? (
        <p className="text-muted-foreground text-sm">
          Vous ne pouvez pas modifier votre propre rôle ni suspendre votre
          compte.
        </p>
      ) : null}
    </div>
  );
}
