"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { UserRole } from "@/lib/constants";
import { hasPermission } from "@/lib/rbac";
import type {
  AdminUserDetail,
  AdminUserNoteItem,
} from "@/features/admin/types";
import { ROLE_LABELS, STATUS_LABELS } from "@/features/admin/constants";
import {
  changeUserRoleAction,
  reactivateUserAction,
  resendVerificationAction,
  revokeSessionsAction,
  sendPasswordResetAction,
  suspendUserAction,
  type AdminActionResult,
} from "@/features/admin/actions";
import { suspendConfirmationPhrase } from "@/features/admin/lib/suspend-confirmation";
import { AdminNotesPanel } from "@/features/admin/components/admin-notes-panel";
import { StatusBadge } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

const initial: AdminActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full max-w-xs rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Props = {
  user: AdminUserDetail;
  notes: AdminUserNoteItem[];
  actorRole: UserRole;
  actorId: string;
  /** Affiche la phrase de confirmation production (passé depuis le serveur). */
  isProduction?: boolean;
};

function useActionToast(state: AdminActionResult | undefined) {
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);
}

export function UserDetailPanel({
  user,
  notes,
  actorRole,
  actorId,
  isProduction = false,
}: Props) {
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
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeSessionsAction,
    initial,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    sendPasswordResetAction,
    initial,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    resendVerificationAction,
    initial,
  );

  useActionToast(suspendState);
  useActionToast(reactivateState);
  useActionToast(roleState);
  useActionToast(revokeState);
  useActionToast(resetState);
  useActionToast(verifyState);

  const isSelf = actorId === user.id;
  const isSuperAdmin = actorRole === "super_admin";
  const canSuspend = hasPermission(actorRole, "users.suspend");
  const canRevoke = hasPermission(actorRole, "users.sessions.revoke");
  const canReset = hasPermission(actorRole, "users.password.reset");
  const canResend = hasPermission(actorRole, "users.resend_verification");
  const canChangeRole =
    isSuperAdmin && hasPermission(actorRole, "users.roles.manage");

  const canManageMidStaff =
    actorRole === "admin" || actorRole === "super_admin";
  const targetIsPrivileged =
    user.role === "admin" || user.role === "super_admin";
  const canSuspendOrReactivate =
    canSuspend &&
    !isSelf &&
    (user.role === "user" ||
      (canManageMidStaff && !targetIsPrivileged) ||
      (isSuperAdmin && targetIsPrivileged)) &&
    !(user.isLastActiveSuperAdmin && user.status === "active");

  const confirmPhrase = suspendConfirmationPhrase(user.email);

  return (
    <div className="flex flex-col gap-10">
      {user.isLastActiveSuperAdmin ? (
        <p
          role="status"
          className="border-warning/40 bg-warning/10 text-warning-foreground rounded-lg border px-3 py-2 text-sm"
        >
          Dernier super_admin actif — suspension et rétrogradation bloquées pour
          protéger le système.
        </p>
      ) : null}

      {/* A. Vue d'ensemble */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sebavio-navy text-base font-semibold">
          Vue d&apos;ensemble
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Courriel</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Nom</dt>
            <dd>
              {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
            </dd>
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
            <dt className="text-muted-foreground">Dernière connexion</dt>
            <dd>
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString("fr-CA")
                : "—"}
            </dd>
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
            <dt className="text-muted-foreground">Mot de passe modifié</dt>
            <dd>
              {user.passwordChangedAt
                ? new Date(user.passwordChangedAt).toLocaleString("fr-CA")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Version de session</dt>
            <dd className="tabular-nums">{user.sessionVersion}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sessions actives</dt>
            <dd className="tabular-nums">{user.activeSessionCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Véhicules</dt>
            <dd className="tabular-nums">{user.vehicleCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Voyages</dt>
            <dd className="tabular-nums">{user.tripCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="tabular-nums">{user.notesCount}</dd>
          </div>
          {user.status === "suspended" ? (
            <>
              <div>
                <dt className="text-muted-foreground">Suspendu le</dt>
                <dd>
                  {user.suspendedAt
                    ? new Date(user.suspendedAt).toLocaleString("fr-CA")
                    : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Motif de suspension</dt>
                <dd>{user.suspensionReason ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fin de suspension</dt>
                <dd>
                  {user.suspensionEndsAt
                    ? new Date(user.suspensionEndsAt).toLocaleString("fr-CA")
                    : "Indéterminée"}
                </dd>
              </div>
            </>
          ) : null}
          {user.reactivatedAt ? (
            <div>
              <dt className="text-muted-foreground">Réactivé le</dt>
              <dd>{new Date(user.reactivatedAt).toLocaleString("fr-CA")}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* B. Voyages récents */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sebavio-navy text-base font-semibold">
          Voyages récents
        </h2>
        {user.recentTrips.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun voyage.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Départ</TableHead>
                <TableHead>Créé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.recentTrips.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{t.destination || "—"}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(t.departureDate).toLocaleDateString("fr-CA")}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(t.createdAt).toLocaleDateString("fr-CA")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* C. Véhicules */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sebavio-navy text-base font-semibold">Véhicules</h2>
        {user.vehicles.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun véhicule.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Surnom</TableHead>
                <TableHead>Plaque</TableHead>
                <TableHead>Ajouté</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    {v.label ?? "—"}
                  </TableCell>
                  <TableCell>{v.nickname ?? "—"}</TableCell>
                  <TableCell>{v.licensePlate ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(v.createdAt).toLocaleDateString("fr-CA")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* D. Notes */}
      <AdminNotesPanel userId={user.id} notes={notes} actorRole={actorRole} />

      {/* E. Actions dangereuses */}
      <section className="border-destructive/30 flex flex-col gap-6 rounded-lg border p-4">
        <h2 className="text-sebavio-navy text-base font-semibold">
          Actions sensibles
        </h2>
        <p className="text-muted-foreground text-sm">
          Ces opérations sont journalisées et peuvent déconnecter
          l&apos;utilisateur.
        </p>

        {user.status === "active" && canSuspendOrReactivate ? (
          <form action={suspendAction} className="flex max-w-md flex-col gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="email" value={user.email} />
            <h3 className="text-sm font-medium">Suspendre le compte</h3>
            <Input
              name="reason"
              placeholder="Motif (obligatoire)"
              required
              minLength={3}
              maxLength={500}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="suspension-ends" className="text-sm font-medium">
                Fin de suspension (facultatif)
              </label>
              <Input
                id="suspension-ends"
                name="suspensionEndsAt"
                type="datetime-local"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="suspend-confirm" className="text-sm font-medium">
                Confirmation
              </label>
              <Input
                id="suspend-confirm"
                name="confirmation"
                placeholder={confirmPhrase}
                required={isProduction}
                autoComplete="off"
              />
              <p className="text-muted-foreground text-xs">
                {isProduction
                  ? `En production, tapez exactement « ${confirmPhrase} ».`
                  : `Hors production, la confirmation est facultative. En production : « ${confirmPhrase} ».`}
              </p>
            </div>
            <Button
              type="submit"
              variant="destructive"
              disabled={suspendPending}
            >
              {suspendPending ? "Suspension…" : "Suspendre"}
            </Button>
          </form>
        ) : null}

        {user.status === "suspended" && canSuspendOrReactivate ? (
          <form
            action={reactivateAction}
            className="flex max-w-md flex-col gap-3"
          >
            <input type="hidden" name="userId" value={user.id} />
            <h3 className="text-sm font-medium">Réactiver le compte</h3>
            <Input
              name="reason"
              placeholder="Motif (obligatoire)"
              required
              minLength={3}
              maxLength={500}
            />
            <Button type="submit" disabled={reactivatePending}>
              {reactivatePending ? "Réactivation…" : "Réactiver"}
            </Button>
          </form>
        ) : null}

        {canRevoke ? (
          <form action={revokeAction} className="flex max-w-md flex-col gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <h3 className="text-sm font-medium">
              Révoquer toutes les sessions
            </h3>
            {isSelf ? (
              <p className="text-warning-foreground text-sm">
                Attention : vous allez vous déconnecter immédiatement. Cochez la
                case de confirmation ci-dessous.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                L&apos;utilisateur devra se reconnecter. Les JWT existants
                deviennent invalides.
              </p>
            )}
            <Input
              name="reason"
              placeholder="Motif (obligatoire)"
              required
              minLength={3}
              maxLength={500}
            />
            {isSelf ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="allowSelf" value="true" required />
                Je confirme la révocation de mes propres sessions
              </label>
            ) : null}
            <Button type="submit" variant="outline" disabled={revokePending}>
              {revokePending ? "Révocation…" : "Révoquer les sessions"}
            </Button>
          </form>
        ) : null}

        {canReset && !isSelf && user.status === "active" ? (
          <form action={resetAction} className="flex max-w-md flex-col gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <h3 className="text-sm font-medium">
              Envoyer un lien de réinitialisation
            </h3>
            <Input
              name="reason"
              placeholder="Motif (obligatoire)"
              required
              minLength={3}
              maxLength={500}
            />
            <Button type="submit" variant="outline" disabled={resetPending}>
              {resetPending ? "Envoi…" : "Envoyer le lien"}
            </Button>
          </form>
        ) : null}

        {canResend && !user.emailVerified && !isSelf ? (
          <form action={verifyAction} className="flex max-w-md flex-col gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <h3 className="text-sm font-medium">
              Renvoyer le courriel de vérification
            </h3>
            <Input
              name="reason"
              placeholder="Motif (obligatoire)"
              required
              minLength={3}
              maxLength={500}
            />
            <Button type="submit" variant="outline" disabled={verifyPending}>
              {verifyPending ? "Envoi…" : "Renvoyer la vérification"}
            </Button>
          </form>
        ) : null}

        {canChangeRole && !isSelf ? (
          <form action={roleAction} className="flex max-w-md flex-col gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <h3 className="text-sm font-medium">Changer le rôle</h3>
            <p className="text-muted-foreground text-sm">
              L&apos;utilisateur devra se reconnecter après le changement.
            </p>
            <select
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
            <Input
              name="reason"
              placeholder="Motif (obligatoire)"
              required
              minLength={3}
              maxLength={500}
            />
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
            Certaines actions sont restreintes sur votre propre compte.
          </p>
        ) : null}
      </section>
    </div>
  );
}
