-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "kind" VARCHAR(20) NOT NULL DEFAULT 'activity',
    "category" VARCHAR(60) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "address" VARCHAR(300),
    "city" VARCHAR(120),
    "region" VARCHAR(120),
    "country_code" CHAR(2) NOT NULL DEFAULT 'CA',
    "family_score" INTEGER,
    "pet_friendly" BOOLEAN NOT NULL DEFAULT false,
    "estimated_duration_min" INTEGER,
    "price_indicative" DECIMAL(8,2),
    "season" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "rating" DECIMAL(3,2),
    "website" TEXT,
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_activity_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stop_activities" (
    "id" UUID NOT NULL,
    "trip_stop_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "trip_stop_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_latitude_longitude_idx" ON "activities"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "activities_category_city_idx" ON "activities"("category", "city");

-- CreateIndex
CREATE INDEX "activities_kind_idx" ON "activities"("kind");

-- CreateIndex
CREATE INDEX "activities_deleted_at_idx" ON "activities"("deleted_at");

-- CreateIndex
CREATE INDEX "activities_source_idx" ON "activities"("source");

-- CreateIndex
CREATE INDEX "activities_pet_friendly_idx" ON "activities"("pet_friendly");

-- CreateIndex
CREATE INDEX "user_activity_favorites_user_id_idx" ON "user_activity_favorites"("user_id");

-- CreateIndex
CREATE INDEX "user_activity_favorites_activity_id_idx" ON "user_activity_favorites"("activity_id");

-- CreateIndex
CREATE INDEX "user_activity_favorites_deleted_at_idx" ON "user_activity_favorites"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_activity_favorites_user_id_activity_id_key" ON "user_activity_favorites"("user_id", "activity_id");

-- CreateIndex
CREATE INDEX "trip_stop_activities_trip_stop_id_sequence_idx" ON "trip_stop_activities"("trip_stop_id", "sequence");

-- CreateIndex
CREATE INDEX "trip_stop_activities_activity_id_idx" ON "trip_stop_activities"("activity_id");

-- CreateIndex
CREATE INDEX "trip_stop_activities_deleted_at_idx" ON "trip_stop_activities"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "trip_stop_activities_trip_stop_id_activity_id_key" ON "trip_stop_activities"("trip_stop_id", "activity_id");

-- AddForeignKey
ALTER TABLE "user_activity_favorites" ADD CONSTRAINT "user_activity_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_favorites" ADD CONSTRAINT "user_activity_favorites_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stop_activities" ADD CONSTRAINT "trip_stop_activities_trip_stop_id_fkey" FOREIGN KEY ("trip_stop_id") REFERENCES "trip_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stop_activities" ADD CONSTRAINT "trip_stop_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
