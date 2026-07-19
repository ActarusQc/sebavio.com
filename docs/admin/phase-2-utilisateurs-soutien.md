# Centre d’administration — Phase 2 (Utilisateurs et soutien)

> Date : 2026-07-19. S’appuie sur la Phase 1 (`docs/admin/phase-1-fondation.md`).

## Réutilisé

- Auth.js JWT + Argon2 + `VerificationToken` (reset / verify)
- `sendAuthEmail` (SMTP)
- RBAC `src/lib/rbac` + `requirePermission`
- `audit_logs` + `writeAdminAuditLog`
- Pages `/admin/users` déjà amorcées en Phase 1
- Statuts existants : `active` | `suspended` | `deleted` (pas de nouvel enum)

## Ajouts

| Élément | Détail |
| --- | --- |
| `sessionVersion` | Invalide les JWT immédiatement (comparé à chaque refresh JWT) |
| Suspension enrichie | `suspendedAt`, `reason`, `suspendedById`, `suspensionEndsAt`, auto-levée à la connexion |
| `AdminUserNote` | Notes privées (soft-delete) |
| Actions | reset MDP, resend verify, revoke sessions, notes, export CSV |

## Révocation JWT

1. Admin bump `users.session_version` (+ soft-delete `sessions`)
2. Callback JWT compare `token.sessionVersion` ↔ DB
3. Écart → `token.status = deleted` → Proxy refuse → reconnexion

## Non implanté (volontaire)

- Mot de passe temporaire SUPER_ADMIN
- Impersonation
- Stripe / forfaits / IA / analytics avancées (Phase 3+)
- MFA obligatoire (Phase 7)
