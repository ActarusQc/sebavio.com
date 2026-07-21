-- AlterTable plans
ALTER TABLE "plans" ADD COLUMN "is_system_protected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable plan_prices
ALTER TABLE "plan_prices" ADD COLUMN "billing_type" VARCHAR(20) NOT NULL DEFAULT 'recurring';
ALTER TABLE "plan_prices" ADD COLUMN "access_duration_days" INTEGER;

ALTER TABLE "plan_prices"
  ADD CONSTRAINT "plan_prices_billing_type_check"
  CHECK ("billing_type" IN ('recurring', 'one_time'));

ALTER TABLE "plan_prices"
  ADD CONSTRAINT "plan_prices_access_duration_check"
  CHECK (
    ("billing_type" = 'recurring' AND "access_duration_days" IS NULL)
    OR ("billing_type" = 'one_time' AND "access_duration_days" IS NOT NULL AND "access_duration_days" > 0)
  );

CREATE INDEX "plan_prices_billing_type_idx" ON "plan_prices"("billing_type");

-- CreateTable plan_purchases
CREATE TABLE "plan_purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "plan_price_id" UUID NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "stripe_checkout_session_id" VARCHAR(255),
    "stripe_payment_intent_id" VARCHAR(255),
    "activation_stripe_event_id" VARCHAR(255),
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "stripe_mode" VARCHAR(10) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "refunded_at" TIMESTAMPTZ(6),
    "return_context" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_purchases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plan_purchases_status_check"
      CHECK ("status" IN ('pending_payment', 'paid', 'failed', 'refunded')),
    CONSTRAINT "plan_purchases_stripe_mode_check"
      CHECK ("stripe_mode" IN ('test', 'live')),
    CONSTRAINT "plan_purchases_amount_non_negative"
      CHECK ("amount_cents" >= 0)
);

CREATE UNIQUE INDEX "plan_purchases_stripe_checkout_session_id_stripe_mode_key"
  ON "plan_purchases"("stripe_checkout_session_id", "stripe_mode");
CREATE UNIQUE INDEX "plan_purchases_activation_stripe_event_id_stripe_mode_key"
  ON "plan_purchases"("activation_stripe_event_id", "stripe_mode");
CREATE INDEX "plan_purchases_user_id_idx" ON "plan_purchases"("user_id");
CREATE INDEX "plan_purchases_plan_id_idx" ON "plan_purchases"("plan_id");
CREATE INDEX "plan_purchases_status_idx" ON "plan_purchases"("status");
CREATE INDEX "plan_purchases_stripe_mode_idx" ON "plan_purchases"("stripe_mode");
CREATE INDEX "plan_purchases_created_at_idx" ON "plan_purchases"("created_at");

ALTER TABLE "plan_purchases"
  ADD CONSTRAINT "plan_purchases_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_purchases"
  ADD CONSTRAINT "plan_purchases_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_purchases"
  ADD CONSTRAINT "plan_purchases_plan_price_id_fkey"
  FOREIGN KEY ("plan_price_id") REFERENCES "plan_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable plan_access_grants
CREATE TABLE "plan_access_grants" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "source_purchase_id" UUID,
    "status" VARCHAR(40) NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "last_extension_event_id" VARCHAR(255),
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_reason" TEXT,
    "revoked_by_admin_id" UUID,
    "last_admin_extend_at" TIMESTAMPTZ(6),
    "last_admin_extend_by_id" UUID,
    "last_admin_extend_days" INTEGER,
    "last_admin_extend_reason" TEXT,
    "stripe_mode" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_access_grants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plan_access_grants_status_check"
      CHECK ("status" IN ('pending_payment', 'active', 'expired', 'refunded', 'revoked', 'payment_failed')),
    CONSTRAINT "plan_access_grants_stripe_mode_check"
      CHECK ("stripe_mode" IN ('test', 'live')),
    CONSTRAINT "plan_access_grants_ends_after_starts"
      CHECK ("ends_at" > "starts_at")
);

CREATE UNIQUE INDEX "plan_access_grants_source_purchase_id_key"
  ON "plan_access_grants"("source_purchase_id");
CREATE INDEX "plan_access_grants_user_id_idx" ON "plan_access_grants"("user_id");
CREATE INDEX "plan_access_grants_plan_id_idx" ON "plan_access_grants"("plan_id");
CREATE INDEX "plan_access_grants_status_idx" ON "plan_access_grants"("status");
CREATE INDEX "plan_access_grants_ends_at_idx" ON "plan_access_grants"("ends_at");
CREATE INDEX "plan_access_grants_stripe_mode_idx" ON "plan_access_grants"("stripe_mode");
CREATE INDEX "plan_access_grants_user_id_plan_id_status_idx"
  ON "plan_access_grants"("user_id", "plan_id", "status");

ALTER TABLE "plan_access_grants"
  ADD CONSTRAINT "plan_access_grants_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_access_grants"
  ADD CONSTRAINT "plan_access_grants_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_access_grants"
  ADD CONSTRAINT "plan_access_grants_source_purchase_id_fkey"
  FOREIGN KEY ("source_purchase_id") REFERENCES "plan_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_access_grants"
  ADD CONSTRAINT "plan_access_grants_revoked_by_admin_id_fkey"
  FOREIGN KEY ("revoked_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_access_grants"
  ADD CONSTRAINT "plan_access_grants_last_admin_extend_by_id_fkey"
  FOREIGN KEY ("last_admin_extend_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
