/**
 * Seed idempotent des forfaits officiels Sebavio (mode Stripe test uniquement).
 * Usage : npm run prisma:seed:official-plans
 *
 * Ne recrée pas les prix Stripe si montant/devise/type correspondent.
 * Ne réactive pas les forfaits archivés.
 */
import "dotenv/config";

import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-06-24.dahlia" as const;

type EntitlementSeed = {
  key: string;
  enabled: boolean;
  limit: number | null;
  value: string | null;
};

type OfficialPlanDef = {
  internalName: string;
  publicName: string;
  shortDescription: string;
  fullDescription: string;
  displayOrder: number;
  isFeatured: boolean;
  isVisibleOnSignup: boolean;
  isSystemProtected: boolean;
  /** null = forfait gratuit sans produit Stripe */
  price: null | {
    billingType: "one_time" | "recurring";
    unitAmount: number;
    currency: string;
    interval: string;
    intervalCount: number;
    accessDurationDays: number | null;
  };
  entitlements: EntitlementSeed[];
};

const DISCOVERY_ENTITLEMENTS: EntitlementSeed[] = [
  { key: "trip.preview.enabled", enabled: true, limit: null, value: null },
  { key: "trip.full_access.enabled", enabled: false, limit: null, value: null },
  { key: "trips.max", enabled: true, limit: 1, value: null },
  { key: "vehicles.max", enabled: true, limit: 1, value: null },
  { key: "campings.max", enabled: true, limit: 5, value: null },
  { key: "activities.max", enabled: true, limit: 5, value: null },
  {
    key: "trip.gps_tracking.enabled",
    enabled: false,
    limit: null,
    value: null,
  },
  { key: "trip.travel_mode.enabled", enabled: false, limit: null, value: null },
  {
    key: "fuel.stations.detailed.enabled",
    enabled: false,
    limit: null,
    value: null,
  },
  { key: "trip.detours.enabled", enabled: false, limit: null, value: null },
  { key: "trip.optimize.enabled", enabled: false, limit: null, value: null },
  { key: "ai.planning.enabled", enabled: false, limit: null, value: null },
  {
    key: "ai.recommendations.enabled",
    enabled: false,
    limit: null,
    value: null,
  },
  {
    key: "fuel.optimization.enabled",
    enabled: false,
    limit: null,
    value: null,
  },
  { key: "fuel.live_prices.enabled", enabled: false, limit: null, value: null },
  { key: "trip.sharing.enabled", enabled: false, limit: null, value: null },
  { key: "trip.export_pdf.enabled", enabled: false, limit: null, value: null },
  { key: "weather.forecast_days", enabled: true, limit: 3, value: null },
  { key: "notifications.enabled", enabled: true, limit: null, value: null },
  { key: "support.priority", enabled: true, limit: null, value: "standard" },
];

const FULL_ENTITLEMENTS: EntitlementSeed[] = [
  { key: "trip.preview.enabled", enabled: true, limit: null, value: null },
  { key: "trip.full_access.enabled", enabled: true, limit: null, value: null },
  { key: "trips.max", enabled: true, limit: null, value: null },
  { key: "vehicles.max", enabled: true, limit: null, value: null },
  { key: "campings.max", enabled: true, limit: null, value: null },
  { key: "activities.max", enabled: true, limit: null, value: null },
  { key: "trip.gps_tracking.enabled", enabled: true, limit: null, value: null },
  { key: "trip.travel_mode.enabled", enabled: true, limit: null, value: null },
  {
    key: "fuel.stations.detailed.enabled",
    enabled: true,
    limit: null,
    value: null,
  },
  { key: "trip.detours.enabled", enabled: true, limit: null, value: null },
  { key: "trip.optimize.enabled", enabled: true, limit: null, value: null },
  { key: "ai.planning.enabled", enabled: true, limit: null, value: null },
  {
    key: "ai.recommendations.enabled",
    enabled: true,
    limit: null,
    value: null,
  },
  { key: "fuel.optimization.enabled", enabled: true, limit: null, value: null },
  { key: "fuel.live_prices.enabled", enabled: true, limit: null, value: null },
  { key: "trip.sharing.enabled", enabled: true, limit: null, value: null },
  { key: "trip.export_pdf.enabled", enabled: true, limit: null, value: null },
  { key: "weather.forecast_days", enabled: true, limit: 16, value: null },
  { key: "notifications.enabled", enabled: true, limit: null, value: null },
  { key: "support.priority", enabled: true, limit: null, value: "priority" },
];

const OFFICIAL_PLANS: OfficialPlanDef[] = [
  {
    internalName: "decouverte",
    publicName: "Découverte",
    shortDescription: "Aperçu gratuit pour découvrir Sebavio.",
    fullDescription:
      "Forfait gratuit avec aperçu limité. Idéal pour explorer l’application avant de débloquer l’accès complet.",
    displayOrder: 0,
    isFeatured: false,
    isVisibleOnSignup: true,
    isSystemProtected: true,
    price: null,
    entitlements: DISCOVERY_ENTITLEMENTS,
  },
  {
    internalName: "pass-30-jours",
    publicName: "Pass 30 jours",
    shortDescription: "Accès complet pendant 30 jours — paiement unique.",
    fullDescription:
      "Pass d’accès complet à Sebavio pendant 30 jours, sans abonnement récurrent.",
    displayOrder: 1,
    isFeatured: true,
    isVisibleOnSignup: true,
    isSystemProtected: true,
    price: {
      billingType: "one_time",
      unitAmount: 1299,
      currency: "cad",
      interval: "one_time",
      intervalCount: 1,
      accessDurationDays: 30,
    },
    entitlements: FULL_ENTITLEMENTS,
  },
  {
    internalName: "sebavio-plus",
    publicName: "Sebavio Plus",
    shortDescription: "Abonnement annuel complet.",
    fullDescription:
      "Accès complet à toutes les fonctionnalités Sebavio, facturé annuellement.",
    displayOrder: 2,
    isFeatured: true,
    isVisibleOnSignup: true,
    isSystemProtected: true,
    price: {
      billingType: "recurring",
      unitAmount: 6999,
      currency: "cad",
      interval: "year",
      intervalCount: 1,
      accessDurationDays: null,
    },
    entitlements: FULL_ENTITLEMENTS,
  },
];

type SeedSummaryLine = {
  slug: string;
  action: string;
  planId: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
};

function assertTestMode(): "test" {
  const mode = (process.env.STRIPE_MODE ?? "").trim().toLowerCase();
  if (mode !== "test") {
    throw new Error(
      `Aborté : STRIPE_MODE doit être « test » (reçu : « ${mode || "absent"} »).`,
    );
  }
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key.startsWith("sk_test_")) {
    throw new Error(
      "Aborté : STRIPE_SECRET_KEY doit être une clé sk_test_ en mode test.",
    );
  }
  return "test";
}

function createStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });
}

function sebavioMetadata(planId: string, mode: "test") {
  return {
    sebavio_app: "sebavio",
    sebavio_plan_id: planId,
    sebavio_stripe_mode: mode,
  };
}

async function upsertEntitlements(
  prisma: PrismaClient,
  planId: string,
  entitlements: EntitlementSeed[],
): Promise<void> {
  for (const e of entitlements) {
    await prisma.planEntitlement.upsert({
      where: { planId_key: { planId, key: e.key } },
      create: {
        planId,
        key: e.key,
        enabled: e.enabled,
        limit: e.limit,
        value: e.value,
      },
      update: {
        enabled: e.enabled,
        limit: e.limit,
        value: e.value,
      },
    });
  }
}

async function ensureStripeProduct(
  stripe: Stripe,
  planId: string,
  def: OfficialPlanDef,
  existingProductId: string | null,
  mode: "test",
): Promise<string> {
  if (existingProductId) {
    try {
      const product = await stripe.products.retrieve(existingProductId);
      if (!("deleted" in product && product.deleted)) {
        await stripe.products.update(existingProductId, {
          name: def.publicName,
          description: def.shortDescription,
          metadata: sebavioMetadata(planId, mode),
          active: true,
        });
        return existingProductId;
      }
    } catch {
      // recréer ci-dessous
    }
  }

  const product = await stripe.products.create(
    {
      name: def.publicName,
      description: def.shortDescription,
      active: true,
      metadata: sebavioMetadata(planId, mode),
    },
    { idempotencyKey: `official-plan:${def.internalName}:${mode}:product` },
  );
  return product.id;
}

function priceMatches(
  local: {
    unitAmount: number;
    currency: string;
    billingType: string;
    interval: string;
    intervalCount: number;
    accessDurationDays: number | null;
  },
  desired: NonNullable<OfficialPlanDef["price"]>,
): boolean {
  return (
    local.unitAmount === desired.unitAmount &&
    local.currency.toLowerCase() === desired.currency.toLowerCase() &&
    local.billingType === desired.billingType &&
    local.interval === desired.interval &&
    local.intervalCount === desired.intervalCount &&
    (local.accessDurationDays ?? null) === (desired.accessDurationDays ?? null)
  );
}

async function ensureStripePrice(
  stripe: Stripe,
  planId: string,
  productId: string,
  desired: NonNullable<OfficialPlanDef["price"]>,
  mode: "test",
): Promise<string> {
  if (desired.billingType === "one_time") {
    const price = await stripe.prices.create(
      {
        product: productId,
        unit_amount: desired.unitAmount,
        currency: desired.currency,
        metadata: sebavioMetadata(planId, mode),
      },
      {
        idempotencyKey: `official-plan:${planId}:price:one_time:${desired.unitAmount}:${desired.currency}`,
      },
    );
    return price.id;
  }

  const price = await stripe.prices.create(
    {
      product: productId,
      unit_amount: desired.unitAmount,
      currency: desired.currency,
      recurring: {
        interval: desired.interval as "day" | "week" | "month" | "year",
        interval_count: desired.intervalCount,
      },
      metadata: sebavioMetadata(planId, mode),
    },
    {
      idempotencyKey: `official-plan:${planId}:price:${desired.interval}:${desired.intervalCount}:${desired.currency}:${desired.unitAmount}`,
    },
  );
  return price.id;
}

async function seedPlan(
  prisma: PrismaClient,
  stripe: Stripe,
  mode: "test",
  def: OfficialPlanDef,
): Promise<SeedSummaryLine> {
  const existing = await prisma.plan.findUnique({
    where: {
      internalName_stripeMode: {
        internalName: def.internalName,
        stripeMode: mode,
      },
    },
    include: {
      prices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (existing?.status === "archived") {
    console.log(
      `  [skip] ${def.internalName} est archivé — aucune réactivation.`,
    );
    return {
      slug: def.internalName,
      action: "skipped_archived",
      planId: existing.id,
      stripeProductId: existing.stripeProductId,
      stripePriceId:
        existing.prices.find((p) => p.isCurrent)?.stripePriceId ?? null,
    };
  }

  let planId = existing?.id ?? randomUUID();
  let action = existing ? "updated" : "created";
  let stripeProductId = existing?.stripeProductId ?? null;
  let stripePriceId: string | null =
    existing?.prices.find((p) => p.isCurrent)?.stripePriceId ?? null;

  if (!existing) {
    await prisma.plan.create({
      data: {
        id: planId,
        internalName: def.internalName,
        publicName: def.publicName,
        shortDescription: def.shortDescription,
        fullDescription: def.fullDescription,
        displayOrder: def.displayOrder,
        isFeatured: def.isFeatured,
        isVisibleOnSignup: def.isVisibleOnSignup,
        isSystemProtected: def.isSystemProtected,
        status: "active",
        stripeProductId: null,
        stripeMode: mode,
        reconciliationError: null,
      },
    });
  } else {
    await prisma.plan.update({
      where: { id: existing.id },
      data: {
        publicName: def.publicName,
        shortDescription: def.shortDescription,
        fullDescription: def.fullDescription,
        displayOrder: def.displayOrder,
        isFeatured: def.isFeatured,
        isVisibleOnSignup: def.isVisibleOnSignup,
        isSystemProtected: def.isSystemProtected,
        // ne pas forcer status si hidden etc. — seulement metadata
      },
    });
    planId = existing.id;
  }

  await upsertEntitlements(prisma, planId, def.entitlements);

  if (!def.price) {
    // Gratuit : pas de produit Stripe
    if (stripeProductId) {
      console.log(
        `  [info] ${def.internalName} gratuit — stripeProductId conservé (${stripeProductId}) si déjà présent.`,
      );
    }
    return {
      slug: def.internalName,
      action,
      planId,
      stripeProductId,
      stripePriceId: null,
    };
  }

  stripeProductId = await ensureStripeProduct(
    stripe,
    planId,
    def,
    stripeProductId,
    mode,
  );

  const current = existing?.prices.find((p) => p.isCurrent) ?? null;
  if (current && priceMatches(current, def.price)) {
    stripePriceId = current.stripePriceId;
    action = existing ? "unchanged_price" : action;
  } else {
    const newPriceId = await ensureStripePrice(
      stripe,
      planId,
      stripeProductId,
      def.price,
      mode,
    );
    stripePriceId = newPriceId;

    await prisma.$transaction(async (tx) => {
      if (current) {
        await tx.planPrice.update({
          where: { id: current.id },
          data: {
            isCurrent: false,
            status: "archived",
            archivedAt: new Date(),
          },
        });
        try {
          await stripe.prices.update(current.stripePriceId, { active: false });
        } catch {
          // déjà inactif
        }
      }

      const already = await tx.planPrice.findUnique({
        where: {
          stripePriceId_stripeMode: {
            stripePriceId: newPriceId,
            stripeMode: mode,
          },
        },
      });
      if (!already) {
        await tx.planPrice.create({
          data: {
            planId,
            stripePriceId: newPriceId,
            billingType: def.price!.billingType,
            interval: def.price!.interval,
            intervalCount: def.price!.intervalCount,
            accessDurationDays: def.price!.accessDurationDays,
            currency: def.price!.currency,
            unitAmount: def.price!.unitAmount,
            status: "active",
            isCurrent: true,
            stripeMode: mode,
          },
        });
      } else {
        await tx.planPrice.update({
          where: { id: already.id },
          data: {
            isCurrent: true,
            status: "active",
            archivedAt: null,
            billingType: def.price!.billingType,
            accessDurationDays: def.price!.accessDurationDays,
          },
        });
      }
    });
    action = current
      ? "price_rotated"
      : action === "created"
        ? "created"
        : "price_created";
  }

  await prisma.plan.update({
    where: { id: planId },
    data: {
      stripeProductId,
      status: existing?.status === "hidden" ? "hidden" : "active",
      reconciliationError: null,
      lastSyncedAt: new Date(),
    },
  });

  // Si plan existait sans prix courant mais on a réutilisé un match — s'assurer ligne locale
  if (def.price && stripePriceId) {
    const localPrice = await prisma.planPrice.findUnique({
      where: {
        stripePriceId_stripeMode: {
          stripePriceId,
          stripeMode: mode,
        },
      },
    });
    if (!localPrice) {
      await prisma.planPrice.create({
        data: {
          planId,
          stripePriceId,
          billingType: def.price.billingType,
          interval: def.price.interval,
          intervalCount: def.price.intervalCount,
          accessDurationDays: def.price.accessDurationDays,
          currency: def.price.currency,
          unitAmount: def.price.unitAmount,
          status: "active",
          isCurrent: true,
          stripeMode: mode,
        },
      });
    }
  }

  return {
    slug: def.internalName,
    action,
    planId,
    stripeProductId,
    stripePriceId,
  };
}

async function main(): Promise<void> {
  const mode = assertTestMode();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est requis.");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const stripe = createStripe();

  const summary: SeedSummaryLine[] = [];

  console.log("=== Seed forfaits officiels (Stripe test) ===");
  try {
    for (const def of OFFICIAL_PLANS) {
      console.log(`→ ${def.internalName}…`);
      const line = await seedPlan(prisma, stripe, mode, def);
      summary.push(line);
      console.log(
        `  ${line.action} | plan=${line.planId} | product=${line.stripeProductId ?? "—"} | price=${line.stripePriceId ?? "—"}`,
      );
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log("\n=== Résumé ===");
  for (const line of summary) {
    console.log(
      `${line.slug.padEnd(16)} ${line.action.padEnd(18)} product=${line.stripeProductId ?? "null"} price=${line.stripePriceId ?? "null"}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
