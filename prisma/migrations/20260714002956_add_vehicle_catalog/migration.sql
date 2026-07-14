-- CreateTable
CREATE TABLE "manufacturers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "country_code" CHAR(2),
    "website" VARCHAR(255),
    "support_url" VARCHAR(255),
    "logo_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" UUID NOT NULL,
    "manufacturer_id" UUID NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "model_name" VARCHAR(150) NOT NULL,
    "trim" VARCHAR(150) NOT NULL DEFAULT '',
    "year" INTEGER NOT NULL,
    "engine" VARCHAR(150),
    "transmission" VARCHAR(100),
    "drive_type" VARCHAR(30),
    "fuel_type" VARCHAR(30),
    "fuel_capacity_l" DECIMAL(6,2),
    "avg_consumption" DECIMAL(6,2),
    "length_m" DECIMAL(6,2),
    "width_m" DECIMAL(6,2),
    "height_m" DECIMAL(6,2),
    "gvwr_kg" INTEGER,
    "sleeping_capacity" INTEGER,
    "fresh_water_l" INTEGER,
    "grey_water_l" INTEGER,
    "black_water_l" INTEGER,
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "file_url" TEXT NOT NULL,
    "language" CHAR(2) NOT NULL,
    "version" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "known_issues" (
    "id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "source" VARCHAR(200) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "known_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_name_key" ON "manufacturers"("name");

-- CreateIndex
CREATE INDEX "manufacturers_name_idx" ON "manufacturers"("name");

-- CreateIndex
CREATE INDEX "manufacturers_active_idx" ON "manufacturers"("active");

-- CreateIndex
CREATE INDEX "manufacturers_source_idx" ON "manufacturers"("source");

-- CreateIndex
CREATE INDEX "vehicle_models_manufacturer_id_year_idx" ON "vehicle_models"("manufacturer_id", "year");

-- CreateIndex
CREATE INDEX "vehicle_models_category_idx" ON "vehicle_models"("category");

-- CreateIndex
CREATE INDEX "vehicle_models_model_name_idx" ON "vehicle_models"("model_name");

-- CreateIndex
CREATE INDEX "vehicle_models_fuel_type_idx" ON "vehicle_models"("fuel_type");

-- CreateIndex
CREATE INDEX "vehicle_models_source_idx" ON "vehicle_models"("source");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_manufacturer_id_year_trim_model_name_key" ON "vehicle_models"("manufacturer_id", "year", "trim", "model_name");

-- CreateIndex
CREATE INDEX "vehicle_documents_model_id_language_idx" ON "vehicle_documents"("model_id", "language");

-- CreateIndex
CREATE INDEX "known_issues_model_id_idx" ON "known_issues"("model_id");

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "known_issues" ADD CONSTRAINT "known_issues_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
