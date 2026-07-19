import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "@/lib/constants";
import {
  ADMIN_AUDIT_DEFAULT_PAGE_SIZE,
  ADMIN_AUDIT_MAX_PAGE_SIZE,
  ADMIN_USER_LIST_DEFAULT_PAGE_SIZE,
} from "@/features/admin/constants";

const optionalBoolQuery = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    return v === "true" || v === "1";
  });

const reasonSchema = z
  .string()
  .trim()
  .min(3, "Motif trop court (minimum 3 caractères)")
  .max(500);

export const ADMIN_NOTE_CATEGORIES = [
  "general",
  "support",
  "security",
  "billing",
  "account",
] as const;

export const ADMIN_NOTE_IMPORTANCES = [
  "normal",
  "important",
  "critical",
] as const;

export const ADMIN_USER_LIST_SORTS = [
  "createdAt",
  "email",
  "name",
  "lastActivity",
  "tripCount",
] as const;

export const adminUserListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(USER_STATUSES).optional(),
  role: z.enum(USER_ROLES).optional(),
  emailVerified: optionalBoolQuery,
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  hasTrips: optionalBoolQuery,
  hasVehicles: optionalBoolQuery,
  sort: z.enum(ADMIN_USER_LIST_SORTS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .default(ADMIN_USER_LIST_DEFAULT_PAGE_SIZE)
    .refine((n): n is 20 | 50 | 100 => n === 20 || n === 50 || n === 100, {
      message: "pageSize doit être 20, 50 ou 100",
    }),
});

export const adminUserRolePatchSchema = z.object({
  role: z.enum(USER_ROLES),
  reason: reasonSchema,
});

export const adminUserSuspendSchema = z.object({
  reason: reasonSchema,
  confirmation: z.string().trim().max(200).optional(),
  suspensionEndsAt: z.coerce.date().optional(),
});

export const adminUserReactivateSchema = z.object({
  reason: reasonSchema,
});

export const adminUserRevokeSessionsSchema = z.object({
  reason: reasonSchema,
  allowSelf: z.boolean().optional(),
});

export const adminUserPasswordResetSchema = z.object({
  reason: reasonSchema,
});

export const adminUserResendVerificationSchema = z.object({
  reason: reasonSchema,
});

export const adminUserNoteCreateSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  category: z.enum(ADMIN_NOTE_CATEGORIES).default("general"),
  importance: z.enum(ADMIN_NOTE_IMPORTANCES).default("normal"),
});

export const adminUserNoteUpdateSchema = z
  .object({
    content: z.string().trim().min(1).max(5000).optional(),
    category: z.enum(ADMIN_NOTE_CATEGORIES).optional(),
    importance: z.enum(ADMIN_NOTE_IMPORTANCES).optional(),
  })
  .refine(
    (v) =>
      v.content !== undefined ||
      v.category !== undefined ||
      v.importance !== undefined,
    { message: "Au moins un champ à modifier est requis" },
  );

export const adminAuditQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  entity: z.string().trim().max(100).optional(),
  action: z.string().trim().max(50).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_AUDIT_MAX_PAGE_SIZE)
    .default(ADMIN_AUDIT_DEFAULT_PAGE_SIZE),
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
export type AdminUserRolePatch = z.infer<typeof adminUserRolePatchSchema>;
export type AdminUserSuspendInput = z.infer<typeof adminUserSuspendSchema>;
export type AdminUserReactivateInput = z.infer<
  typeof adminUserReactivateSchema
>;
export type AdminUserRevokeSessionsInput = z.infer<
  typeof adminUserRevokeSessionsSchema
>;
export type AdminUserPasswordResetInput = z.infer<
  typeof adminUserPasswordResetSchema
>;
export type AdminUserResendVerificationInput = z.infer<
  typeof adminUserResendVerificationSchema
>;
export type AdminUserNoteCreateInput = z.infer<
  typeof adminUserNoteCreateSchema
>;
export type AdminUserNoteUpdateInput = z.infer<
  typeof adminUserNoteUpdateSchema
>;
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;
