/**
 * Administration des Pass 30 jours (PlanAccessGrant).
 */

import "server-only";

import type { Prisma } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getPassRemainingDays } from "@/features/subscriptions/services/access-resolve";
import {
  PASS_ADMIN_DEFAULT_PAGE_SIZE,
  type PassGrantDetail,
  type PassGrantListItem,
  type PassGrantListResult,
} from "@/features/subscriptions/lib/pass-grant-constants";

export type {
  PassGrantDetail,
  PassGrantListItem,
  PassGrantListResult,
  PassGrantStatus,
} from "@/features/subscriptions/lib/pass-grant-constants";

export {
  PASS_ADMIN_DEFAULT_PAGE_SIZE,
  PASS_GRANT_STATUSES,
  PASS_GRANT_STATUS_LABELS,
} from "@/features/subscriptions/lib/pass-grant-constants";

export type ListPassGrantsInput = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

function formatUserName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | null {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

function mapListItem(row: {
  id: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  stripeMode: string;
  createdAt: Date;
  userId: string;
  planId: string;
  sourcePurchaseId: string | null;
  user: {
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
  plan: { publicName: string; internalName: string };
  sourcePurchase: { status: string } | null;
}): PassGrantListItem {
  return {
    id: row.id,
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    remainingDays: getPassRemainingDays(row),
    stripeMode: row.stripeMode,
    createdAt: row.createdAt,
    userId: row.userId,
    userEmail: row.user.email,
    userName: formatUserName(
      row.user.profile?.firstName,
      row.user.profile?.lastName,
    ),
    planId: row.planId,
    planPublicName: row.plan.publicName,
    planInternalName: row.plan.internalName,
    sourcePurchaseId: row.sourcePurchaseId,
    sourcePurchaseStatus: row.sourcePurchase?.status ?? null,
  };
}

export async function listPassGrants(
  input: ListPassGrantsInput = {},
): Promise<PassGrantListResult> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(
    100,
    Math.max(1, input.pageSize ?? PASS_ADMIN_DEFAULT_PAGE_SIZE),
  );
  const where: Prisma.PlanAccessGrantWhereInput = {};

  if (input.status?.trim()) {
    where.status = input.status.trim();
  }

  const search = input.search?.trim();
  if (search) {
    const or: Prisma.PlanAccessGrantWhereInput[] = [
      { user: { email: { contains: search, mode: "insensitive" } } },
      {
        plan: {
          publicName: { contains: search, mode: "insensitive" },
        },
      },
      {
        plan: {
          internalName: { contains: search, mode: "insensitive" },
        },
      },
    ];
    if (search.length === 36) {
      or.push({ id: search }, { userId: search });
    }
    where.OR = or;
  }

  const [total, rows] = await Promise.all([
    prisma.planAccessGrant.count({ where }),
    prisma.planAccessGrant.findMany({
      where,
      orderBy: [{ endsAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        plan: { select: { publicName: true, internalName: true } },
        sourcePurchase: { select: { status: true } },
      },
    }),
  ]);

  return {
    items: rows.map(mapListItem),
    total,
    page,
    pageSize,
  };
}

export async function getPassGrantDetail(id: string): Promise<PassGrantDetail> {
  const row = await prisma.planAccessGrant.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      plan: { select: { publicName: true, internalName: true } },
      sourcePurchase: {
        select: {
          id: true,
          status: true,
          amountCents: true,
          currency: true,
          paidAt: true,
          stripeCheckoutSessionId: true,
          stripePaymentIntentId: true,
        },
      },
      revokedByAdmin: { select: { email: true } },
      lastAdminExtendBy: { select: { email: true } },
    },
  });

  if (!row) {
    throw new AppError("VALIDATION_ERROR", "Droit d'accès introuvable.", 404);
  }

  const base = mapListItem({
    ...row,
    sourcePurchase: row.sourcePurchase
      ? { status: row.sourcePurchase.status }
      : null,
  });

  return {
    ...base,
    revokedAt: row.revokedAt,
    revokedReason: row.revokedReason,
    revokedByAdminId: row.revokedByAdminId,
    revokedByAdminEmail: row.revokedByAdmin?.email ?? null,
    lastAdminExtendAt: row.lastAdminExtendAt,
    lastAdminExtendById: row.lastAdminExtendById,
    lastAdminExtendByEmail: row.lastAdminExtendBy?.email ?? null,
    lastAdminExtendDays: row.lastAdminExtendDays,
    lastAdminExtendReason: row.lastAdminExtendReason,
    lastExtensionEventId: row.lastExtensionEventId,
    sourcePurchase: row.sourcePurchase
      ? {
          id: row.sourcePurchase.id,
          status: row.sourcePurchase.status,
          amountCents: row.sourcePurchase.amountCents,
          currency: row.sourcePurchase.currency,
          paidAt: row.sourcePurchase.paidAt,
          stripeCheckoutSessionId: row.sourcePurchase.stripeCheckoutSessionId,
          stripePaymentIntentId: row.sourcePurchase.stripePaymentIntentId,
        }
      : null,
  };
}
