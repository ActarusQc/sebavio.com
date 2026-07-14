-- CreateTable
CREATE TABLE "trip_budgets" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "planned_amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "expense_date" DATE NOT NULL,
    "merchant" VARCHAR(200),
    "notes" TEXT,
    "source_fuel_log_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_receipts" (
    "id" UUID NOT NULL,
    "expense_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "ocr_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expense_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_budgets_trip_id_key" ON "trip_budgets"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_source_fuel_log_id_key" ON "expenses"("source_fuel_log_id");

-- CreateIndex
CREATE INDEX "expenses_trip_id_expense_date_idx" ON "expenses"("trip_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_deleted_at_idx" ON "expenses"("deleted_at");

-- CreateIndex
CREATE INDEX "expense_receipts_expense_id_idx" ON "expense_receipts"("expense_id");

-- AddForeignKey
ALTER TABLE "trip_budgets" ADD CONSTRAINT "trip_budgets_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_source_fuel_log_id_fkey" FOREIGN KEY ("source_fuel_log_id") REFERENCES "fuel_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
