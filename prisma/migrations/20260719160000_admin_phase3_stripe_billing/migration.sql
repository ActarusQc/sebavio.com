-- Phase 3 Stripe billing projections (non-destructive)

CREATE TABLE IF NOT EXISTS "stripe_customers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_customer_id" VARCHAR(255) NOT NULL,
    "stripe_mode" VARCHAR(10) NOT NULL,
    "email_snapshot" VARCHAR(255),
    "name_snapshot" VARCHAR(255),
    "last_synced_at" TIMESTAMPTZ(6),
    "stripe_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_customers_stripe_customer_id_stripe_mode_key"
  ON "stripe_customers"("stripe_customer_id", "stripe_mode");
CREATE UNIQUE INDEX IF NOT EXISTS "stripe_customers_user_id_stripe_mode_active_key"
  ON "stripe_customers"("user_id", "stripe_mode")
  WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "stripe_customers_user_id_idx" ON "stripe_customers"("user_id");
CREATE INDEX IF NOT EXISTS "stripe_customers_stripe_mode_idx" ON "stripe_customers"("stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_customers_deleted_at_idx" ON "stripe_customers"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_customers_user_id_fkey'
  ) THEN
    ALTER TABLE "stripe_customers"
      ADD CONSTRAINT "stripe_customers_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "stripe_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_customer_id" VARCHAR(255) NOT NULL,
    "stripe_subscription_id" VARCHAR(255) NOT NULL,
    "stripe_price_id" VARCHAR(255),
    "stripe_product_id" VARCHAR(255),
    "status" VARCHAR(40) NOT NULL,
    "currency" VARCHAR(10),
    "unit_amount" INTEGER,
    "billing_interval" VARCHAR(20),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancel_at" TIMESTAMPTZ(6),
    "canceled_at" TIMESTAMPTZ(6),
    "trial_start" TIMESTAMPTZ(6),
    "trial_end" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "latest_invoice_id" VARCHAR(255),
    "stripe_mode" VARCHAR(10) NOT NULL,
    "last_synced_at" TIMESTAMPTZ(6),
    "stripe_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_subscriptions_stripe_subscription_id_stripe_mode_key"
  ON "stripe_subscriptions"("stripe_subscription_id", "stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_subscriptions_user_id_idx" ON "stripe_subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "stripe_subscriptions_stripe_customer_id_idx" ON "stripe_subscriptions"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "stripe_subscriptions_status_idx" ON "stripe_subscriptions"("status");
CREATE INDEX IF NOT EXISTS "stripe_subscriptions_stripe_mode_idx" ON "stripe_subscriptions"("stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_subscriptions_current_period_end_idx" ON "stripe_subscriptions"("current_period_end");
CREATE INDEX IF NOT EXISTS "stripe_subscriptions_created_at_idx" ON "stripe_subscriptions"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE "stripe_subscriptions"
      ADD CONSTRAINT "stripe_subscriptions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "stripe_payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_customer_id" VARCHAR(255),
    "stripe_payment_intent_id" VARCHAR(255) NOT NULL,
    "stripe_charge_id" VARCHAR(255),
    "stripe_invoice_id" VARCHAR(255),
    "amount" INTEGER NOT NULL,
    "amount_received" INTEGER NOT NULL DEFAULT 0,
    "amount_refunded" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "failure_code" VARCHAR(100),
    "failure_message_safe" TEXT,
    "payment_method_type" VARCHAR(40),
    "card_brand" VARCHAR(40),
    "card_last4" VARCHAR(4),
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "stripe_mode" VARCHAR(10) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "last_synced_at" TIMESTAMPTZ(6),
    "stripe_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "stripe_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_payments_stripe_payment_intent_id_stripe_mode_key"
  ON "stripe_payments"("stripe_payment_intent_id", "stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_payments_user_id_idx" ON "stripe_payments"("user_id");
CREATE INDEX IF NOT EXISTS "stripe_payments_stripe_customer_id_idx" ON "stripe_payments"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "stripe_payments_status_idx" ON "stripe_payments"("status");
CREATE INDEX IF NOT EXISTS "stripe_payments_stripe_mode_idx" ON "stripe_payments"("stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_payments_created_at_idx" ON "stripe_payments"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_payments_user_id_fkey'
  ) THEN
    ALTER TABLE "stripe_payments"
      ADD CONSTRAINT "stripe_payments_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "stripe_invoices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_customer_id" VARCHAR(255),
    "stripe_invoice_id" VARCHAR(255) NOT NULL,
    "stripe_subscription_id" VARCHAR(255),
    "number" VARCHAR(100),
    "status" VARCHAR(40),
    "currency" VARCHAR(10),
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "amount_paid" INTEGER NOT NULL DEFAULT 0,
    "amount_due" INTEGER NOT NULL DEFAULT 0,
    "amount_remaining" INTEGER NOT NULL DEFAULT 0,
    "hosted_invoice_url" TEXT,
    "invoice_pdf_url" TEXT,
    "period_start" TIMESTAMPTZ(6),
    "period_end" TIMESTAMPTZ(6),
    "due_date" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "voided_at" TIMESTAMPTZ(6),
    "stripe_mode" VARCHAR(10) NOT NULL,
    "last_synced_at" TIMESTAMPTZ(6),
    "stripe_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "stripe_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_invoices_stripe_invoice_id_stripe_mode_key"
  ON "stripe_invoices"("stripe_invoice_id", "stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_invoices_user_id_idx" ON "stripe_invoices"("user_id");
CREATE INDEX IF NOT EXISTS "stripe_invoices_stripe_customer_id_idx" ON "stripe_invoices"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "stripe_invoices_stripe_subscription_id_idx" ON "stripe_invoices"("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "stripe_invoices_status_idx" ON "stripe_invoices"("status");
CREATE INDEX IF NOT EXISTS "stripe_invoices_stripe_mode_idx" ON "stripe_invoices"("stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_invoices_created_at_idx" ON "stripe_invoices"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_invoices_user_id_fkey'
  ) THEN
    ALTER TABLE "stripe_invoices"
      ADD CONSTRAINT "stripe_invoices_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "stripe_refunds" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_refund_id" VARCHAR(255) NOT NULL,
    "stripe_payment_intent_id" VARCHAR(255),
    "stripe_charge_id" VARCHAR(255),
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "stripe_reason" VARCHAR(60),
    "admin_reason" TEXT,
    "created_by_admin_id" UUID,
    "stripe_mode" VARCHAR(10) NOT NULL,
    "last_synced_at" TIMESTAMPTZ(6),
    "stripe_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "stripe_refunds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_refunds_stripe_refund_id_stripe_mode_key"
  ON "stripe_refunds"("stripe_refund_id", "stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_refunds_payment_id_idx" ON "stripe_refunds"("payment_id");
CREATE INDEX IF NOT EXISTS "stripe_refunds_user_id_idx" ON "stripe_refunds"("user_id");
CREATE INDEX IF NOT EXISTS "stripe_refunds_created_by_admin_id_idx" ON "stripe_refunds"("created_by_admin_id");
CREATE INDEX IF NOT EXISTS "stripe_refunds_status_idx" ON "stripe_refunds"("status");
CREATE INDEX IF NOT EXISTS "stripe_refunds_stripe_mode_idx" ON "stripe_refunds"("stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_refunds_created_at_idx" ON "stripe_refunds"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_refunds_payment_id_fkey'
  ) THEN
    ALTER TABLE "stripe_refunds"
      ADD CONSTRAINT "stripe_refunds_payment_id_fkey"
      FOREIGN KEY ("payment_id") REFERENCES "stripe_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_refunds_user_id_fkey'
  ) THEN
    ALTER TABLE "stripe_refunds"
      ADD CONSTRAINT "stripe_refunds_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_refunds_created_by_admin_id_fkey'
  ) THEN
    ALTER TABLE "stripe_refunds"
      ADD CONSTRAINT "stripe_refunds_created_by_admin_id_fkey"
      FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
    "id" UUID NOT NULL,
    "stripe_event_id" VARCHAR(255) NOT NULL,
    "stripe_mode" VARCHAR(10) NOT NULL,
    "type" VARCHAR(120) NOT NULL,
    "api_version" VARCHAR(40),
    "object_id" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_started_at" TIMESTAMPTZ(6),
    "processed_at" TIMESTAMPTZ(6),
    "last_error_code" VARCHAR(80),
    "last_error_safe" TEXT,
    "next_retry_at" TIMESTAMPTZ(6),
    "payload_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stripe_webhook_events_stripe_event_id_stripe_mode_key"
  ON "stripe_webhook_events"("stripe_event_id", "stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_status_idx" ON "stripe_webhook_events"("status");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_type_idx" ON "stripe_webhook_events"("type");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_stripe_mode_idx" ON "stripe_webhook_events"("stripe_mode");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_received_at_idx" ON "stripe_webhook_events"("received_at");
CREATE INDEX IF NOT EXISTS "stripe_webhook_events_object_id_idx" ON "stripe_webhook_events"("object_id");
