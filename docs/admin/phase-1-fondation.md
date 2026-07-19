# Centre d’administration — Phase 1 (Fondation)

> Plan technique et décisions d’architecture. Source de vérité opérationnelle pour les phases suivantes.  
> Date : 2026-07-19.

## 1. Architecture détectée

| Élément | État actuel |
| --- | --- |
| Auth | Auth.js v5 (JWT 30 min), Credentials + Argon2, `src/lib/auth.ts` |
| Proxy | `src/proxy.ts` — filtre Edge JWT pour `/admin` et `/dashboard` |
| Rôles | `user`, `admin`, `super_admin` (colonne `users.role`) |
| Admin existant | Feature `src/features/admin` — dashboard, utilisateurs FR, audit lecture |
| Audit | Table `audit_logs` (immutable, sans `updated_at`) |
| Stripe | **Absent** — feature `finance` = budgets/dépenses voyage uniquement |
| Plans / abonnements | Non modélisés en Prisma |
| MFA | Stub uniquement (`MfaSetupStub`, `getMfaStub`) |
| Package manager | **npm** (pas pnpm) |

## 2. Décisions Phase 1

1. **Monolithe** : admin intégré sous `/admin` (pas de second app).
2. **RBAC étendu** sans second système : mêmes colonnes `role` / `status`, nouveaux rôles `support`, `analyst`, `billing_admin`.
3. **Convention snake_case** conservée (`super_admin`, pas `SUPER_ADMIN` en base) ; libellés UI en français.
4. **Permissions nommées** (`admin.portal`, `users.read`, …) — jamais se fier uniquement au layout/proxy.
5. **Réutilisation de `audit_logs`** : colonnes optionnelles `actor_role`, `reason`, `user_agent`, `request_id` (pas de table dupliquée).
6. **Routes EN** du cahier des charges comme canonicales ; redirections depuis les URLs FR existantes.
7. **Layout admin distinct** (`AdminShell`) — branding Sebavio, indicateur d’environnement, nav filtrée par permissions.
8. **Promotion** : script CLI `npm run admin:promote` (confirmation interactive + audit système).
9. **MFA** : architecture documentée, non implantée (Phase 7).
10. **Stripe / IA / stats avancées** : hors Phase 1 — fondation permissions + routes stub prêtes.

## 3. Matrice des permissions (résumé)

| Permission | SUPPORT | ANALYST | BILLING_ADMIN | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- | --- |
| `admin.portal` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `users.read` / notes / suspend / reset | ✓ | — | — | ✓ | ✓ |
| `analytics.read` | — | ✓ | — | ✓ | ✓ |
| `billing.*` | — | — | ✓ | ✓ | ✓ |
| `plans.manage` | — | — | — | ✓ | ✓ |
| `content.manage` (catalogue, campings…) | — | — | — | ✓ | ✓ |
| `ai.secrets.manage` / `settings.manage` / `users.roles.manage` | — | — | — | — | ✓ |
| `audit.read` | — | — | — | ✓ | ✓ |

`USER` : aucune permission admin. L’inscription publique force toujours `role=user`.

## 4. Protection serveur

- `requireStaffUser()` — tout rôle staff.
- `requirePermission(perm)` — contrôle fin dans chaque action / route / service.
- `requireAdminUser()` — alias content (`content.manage`) pour APIs catalogue existantes.
- `requireSuperAdminUser()` — secrets / rôles / settings.
- Proxy Edge : accès `/admin` si rôle staff (complément, **pas** seule défense).

## 5. MFA (préparation)

Avant production commerciale :

- TOTP (ou WebAuthn) obligatoire pour tout rôle ≠ `user`.
- Champ futur `mfa_enabled_at` / table `user_mfa_credentials`.
- Blocage admin si MFA absente (`ADMIN_MFA_REQUIRED=true`).
- Voir stub actuel : `src/features/auth/types` + `getMfaStub()`.

## 6. Phases suivantes

| Phase | Contenu |
| --- | --- |
| 2 | Utilisateurs enrichis, notes, sessions, reset MDP |
| 3 | Stripe, webhooks idempotents, paiements |
| 4 | Forfaits & entitlements |
| 5 | Coffre secrets IA |
| 6 | Analytics & santé |
| 7 | MFA, durcissement, docs exploitation |

## 7. Promotion du premier SUPER_ADMIN

```bash
npm run admin:promote -- --email="adresse@example.com"
```

Le script vérifie l’existence, demande confirmation, écrit un audit `system` / `role.promote`, ne crée aucun mot de passe.
