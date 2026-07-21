-- CreateTable
CREATE TABLE "trip_traveler_profiles" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "purpose" VARCHAR(20) NOT NULL,
    "adult_count" INTEGER NOT NULL,
    "child_count" INTEGER NOT NULL DEFAULT 0,
    "child_ages" JSONB NOT NULL DEFAULT '[]',
    "interests" JSONB NOT NULL DEFAULT '[]',
    "budget_preference" VARCHAR(20),
    "duration_preference" VARCHAR(20),
    "max_detour_minutes" INTEGER NOT NULL DEFAULT 15,
    "environment_preference" VARCHAR(20),
    "activity_level" VARCHAR(20),
    "accessibility_needs" JSONB NOT NULL DEFAULT '[]',
    "traveling_with_pet" BOOLEAN NOT NULL DEFAULT false,
    "deferred" BOOLEAN NOT NULL DEFAULT false,
    "suggestions_generated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_traveler_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_activities" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "google_place_id" VARCHAR(255) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'suggested',
    "name" VARCHAR(300) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(120),
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "primary_type" VARCHAR(80),
    "types" JSONB,
    "rating" DECIMAL(3,2),
    "review_count" INTEGER,
    "price_level" VARCHAR(40),
    "website_url" TEXT,
    "google_maps_url" TEXT,
    "photo_reference" TEXT,
    "suggested_for_segment" VARCHAR(40),
    "route_position_km" DECIMAL(10,2),
    "detour_distance_km" DECIMAL(10,2),
    "detour_duration_minutes" INTEGER,
    "estimated_visit_minutes" INTEGER,
    "suitability_score" DECIMAL(5,2),
    "suitability_reasons" JSONB,
    "warning_reasons" JSONB,
    "reject_reason" VARCHAR(80),
    "planned_date" TIMESTAMPTZ(6),
    "planned_start_time" TIMESTAMPTZ(6),
    "planned_end_time" TIMESTAMPTZ(6),
    "sequence" INTEGER,
    "linked_stop_id" UUID,
    "insert_placement" VARCHAR(30),
    "raw_metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_traveler_profiles_trip_id_key" ON "trip_traveler_profiles"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_activities_trip_id_google_place_id_key" ON "trip_activities"("trip_id", "google_place_id");

-- CreateIndex
CREATE INDEX "trip_activities_trip_id_status_idx" ON "trip_activities"("trip_id", "status");

-- CreateIndex
CREATE INDEX "trip_activities_trip_id_suitability_score_idx" ON "trip_activities"("trip_id", "suitability_score");

-- AddForeignKey
ALTER TABLE "trip_traveler_profiles" ADD CONSTRAINT "trip_traveler_profiles_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_activities" ADD CONSTRAINT "trip_activities_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
