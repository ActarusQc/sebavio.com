-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "internal_name" VARCHAR(100) NOT NULL,
    "public_name" VARCHAR(150) NOT NULL,
    "short_description" VARCHAR(500),
    "full_description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_visible_on_signup" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(40) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),
    "default_trial_days" INTEGER,
    "stripe_product_id" VARCHAR(255),
    "stripe_mode" VARCHAR(10) NOT NULL,
    "last_synced_at" TIMESTAMPTZ(6),
    "reconciliation_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_prices" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "stripe_price_id" VARCHAR(255) NOT NULL,
    "interval" VARCHAR(20) NOT NULL,
    "interval_count" INTEGER NOT NULL DEFAULT 1,
    "currency" VARCHAR(10) NOT NULL,
    "unit_amount" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "stripe_mode" VARCHAR(10) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_entitlements" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "limit" INTEGER,
    "value" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_sync_runs" (
    "id" UUID NOT NULL,
    "stripe_mode" VARCHAR(10) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "report" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "plan_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_sync_actions" (
    "id" UUID NOT NULL,
    "sync_run_id" UUID NOT NULL,
    "action_key" VARCHAR(255) NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_sync_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plans_status_idx" ON "plans"("status");

-- CreateIndex
CREATE INDEX "plans_stripe_mode_idx" ON "plans"("stripe_mode");

-- CreateIndex
CREATE INDEX "plans_display_order_idx" ON "plans"("display_order");

-- CreateIndex
CREATE INDEX "plans_is_visible_on_signup_idx" ON "plans"("is_visible_on_signup");

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_product_id_stripe_mode_key" ON "plans"("stripe_product_id", "stripe_mode");

-- CreateIndex
CREATE UNIQUE INDEX "plans_internal_name_stripe_mode_key" ON "plans"("internal_name", "stripe_mode");

-- CreateIndex
CREATE INDEX "plan_prices_plan_id_idx" ON "plan_prices"("plan_id");

-- CreateIndex
CREATE INDEX "plan_prices_stripe_mode_idx" ON "plan_prices"("stripe_mode");

-- CreateIndex
CREATE INDEX "plan_prices_status_idx" ON "plan_prices"("status");

-- CreateIndex
CREATE INDEX "plan_prices_plan_id_interval_interval_count_currency_idx" ON "plan_prices"("plan_id", "interval", "interval_count", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_stripe_price_id_stripe_mode_key" ON "plan_prices"("stripe_price_id", "stripe_mode");

-- CreateIndex
CREATE INDEX "plan_entitlements_key_idx" ON "plan_entitlements"("key");

-- CreateIndex
CREATE UNIQUE INDEX "plan_entitlements_plan_id_key_key" ON "plan_entitlements"("plan_id", "key");

-- CreateIndex
CREATE INDEX "plan_sync_runs_stripe_mode_idx" ON "plan_sync_runs"("stripe_mode");

-- CreateIndex
CREATE INDEX "plan_sync_runs_status_idx" ON "plan_sync_runs"("status");

-- CreateIndex
CREATE INDEX "plan_sync_actions_status_idx" ON "plan_sync_actions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "plan_sync_actions_sync_run_id_action_key_key" ON "plan_sync_actions"("sync_run_id", "action_key");

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_sync_actions" ADD CONSTRAINT "plan_sync_actions_sync_run_id_fkey" FOREIGN KEY ("sync_run_id") REFERENCES "plan_sync_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Partial unique index: one current price per (plan, interval, interval_count, currency)
CREATE UNIQUE INDEX "plan_prices_one_current_per_interval"
  ON "plan_prices" ("plan_id", "interval", "interval_count", "currency")
  WHERE "is_current" = true;

-- CHECK constraints (numeric + allowed values)
ALTER TABLE "plans"
  ADD CONSTRAINT "plans_default_trial_days_non_negative"
  CHECK ("default_trial_days" IS NULL OR "default_trial_days" >= 0);

ALTER TABLE "plans"
  ADD CONSTRAINT "plans_status_allowed"
  CHECK ("status" IN ('active', 'hidden', 'archived', 'pending_reconciliation'));

ALTER TABLE "plans"
  ADD CONSTRAINT "plans_stripe_mode_allowed"
  CHECK ("stripe_mode" IN ('test', 'live'));

ALTER TABLE "plan_prices"
  ADD CONSTRAINT "plan_prices_interval_count_positive"
  CHECK ("interval_count" > 0);

ALTER TABLE "plan_prices"
  ADD CONSTRAINT "plan_prices_unit_amount_non_negative"
  CHECK ("unit_amount" >= 0);

ALTER TABLE "plan_prices"
  ADD CONSTRAINT "plan_prices_status_allowed"
  CHECK ("status" IN ('active', 'archived'));

ALTER TABLE "plan_prices"
  ADD CONSTRAINT "plan_prices_stripe_mode_allowed"
  CHECK ("stripe_mode" IN ('test', 'live'));

ALTER TABLE "plan_entitlements"
  ADD CONSTRAINT "plan_entitlements_limit_non_negative"
  CHECK ("limit" IS NULL OR "limit" >= 0);

ALTER TABLE "plan_sync_runs"
  ADD CONSTRAINT "plan_sync_runs_stripe_mode_allowed"
  CHECK ("stripe_mode" IN ('test', 'live'));

ALTER TABLE "plan_sync_runs"
  ADD CONSTRAINT "plan_sync_runs_status_allowed"
  CHECK ("status" IN ('preview', 'applying', 'completed', 'failed'));

ALTER TABLE "plan_sync_actions"
  ADD CONSTRAINT "plan_sync_actions_status_allowed"
  CHECK ("status" IN ('pending', 'applied', 'skipped', 'failed'));
