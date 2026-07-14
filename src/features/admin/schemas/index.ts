import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "@/lib/constants";
import {
  ADMIN_AUDIT_DEFAULT_PAGE_SIZE,
  ADMIN_AUDIT_MAX_PAGE_SIZE,
  ADMIN_USER_LIST_DEFAULT_PAGE_SIZE,
  ADMIN_USER_LIST_MAX_PAGE_SIZE,
} from "@/features/admin/constants";

export const adminUserListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(USER_STATUSES).optional(),
  role: z.enum(USER_ROLES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_USER_LIST_MAX_PAGE_SIZE)
    .default(ADMIN_USER_LIST_DEFAULT_PAGE_SIZE),
});

export const adminUserRolePatchSchema = z.object({
  role: z.enum(USER_ROLES),
});

export const adminUserSuspendSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

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
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;
