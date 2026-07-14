-- AlterTable
ALTER TABLE "trip_stops" ADD COLUMN     "campground_id" UUID;

-- CreateTable
CREATE TABLE "campgrounds" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "address" VARCHAR(300),
    "city" VARCHAR(120),
    "region" VARCHAR(120),
    "country_code" CHAR(2) NOT NULL DEFAULT 'CA',
    "campground_type" VARCHAR(50) NOT NULL DEFAULT 'campground',
    "max_length_m" DECIMAL(6,2),
    "services" JSONB NOT NULL DEFAULT '[]',
    "pet_friendly" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,2),
    "price_min" DECIMAL(8,2),
    "price_max" DECIMAL(8,2),
    "reservation_url" TEXT,
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "campgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_campground_favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "campground_id" UUID NOT NULL,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_campground_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campgrounds_latitude_longitude_idx" ON "campgrounds"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "campgrounds_deleted_at_idx" ON "campgrounds"("deleted_at");

-- CreateIndex
CREATE INDEX "campgrounds_source_idx" ON "campgrounds"("source");

-- CreateIndex
CREATE INDEX "campgrounds_pet_friendly_idx" ON "campgrounds"("pet_friendly");

-- CreateIndex
CREATE INDEX "campgrounds_campground_type_idx" ON "campgrounds"("campground_type");

-- CreateIndex
CREATE INDEX "user_campground_favorites_user_id_idx" ON "user_campground_favorites"("user_id");

-- CreateIndex
CREATE INDEX "user_campground_favorites_campground_id_idx" ON "user_campground_favorites"("campground_id");

-- CreateIndex
CREATE INDEX "user_campground_favorites_deleted_at_idx" ON "user_campground_favorites"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_campground_favorites_user_id_campground_id_key" ON "user_campground_favorites"("user_id", "campground_id");

-- CreateIndex
CREATE INDEX "trip_stops_campground_id_idx" ON "trip_stops"("campground_id");

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_campground_id_fkey" FOREIGN KEY ("campground_id") REFERENCES "campgrounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_campground_favorites" ADD CONSTRAINT "user_campground_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_campground_favorites" ADD CONSTRAINT "user_campground_favorites_campground_id_fkey" FOREIGN KEY ("campground_id") REFERENCES "campgrounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
