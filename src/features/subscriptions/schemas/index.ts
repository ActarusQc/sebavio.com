import { z } from "zod";

import { PASS_GRANT_STATUSES } from "@/features/subscriptions/lib/pass-grant-constants";

const uuidSchema = z.string().uuid();

export const listPassGrantsSchema = z
  .object({
    status: z.enum(PASS_GRANT_STATUSES).optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const getPassGrantSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const revokePassGrantSchema = z
  .object({
    grantId: uuidSchema,
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export const adminExtendPassSchema = z
  .object({
    grantId: uuidSchema,
    days: z.coerce.number().int().min(1).max(365),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export type ListPassGrantsSchemaInput = z.infer<typeof listPassGrantsSchema>;
export type GetPassGrantInput = z.infer<typeof getPassGrantSchema>;
export type RevokePassGrantInput = z.infer<typeof revokePassGrantSchema>;
export type AdminExtendPassInput = z.infer<typeof adminExtendPassSchema>;
