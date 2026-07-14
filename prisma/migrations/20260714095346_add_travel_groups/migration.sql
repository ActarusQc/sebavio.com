-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "travel_group_id" UUID;

-- CreateTable
CREATE TABLE "travel_groups" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "default_group" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "travel_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_members" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "birth_date" DATE,
    "relationship" VARCHAR(30),
    "mobility_level" VARCHAR(30),
    "special_needs" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "travel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "species" VARCHAR(50),
    "breed" VARCHAR(100),
    "weight_kg" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_preferences" (
    "group_id" UUID NOT NULL,
    "max_drive_hours" DECIMAL(4,1),
    "daily_budget" DECIMAL(10,2),
    "preferred_campground_type" VARCHAR(50),
    "avoid_tolls" BOOLEAN NOT NULL DEFAULT false,
    "avoid_ferries" BOOLEAN NOT NULL DEFAULT false,
    "preferred_activity_types" JSONB,
    "food_preferences" JSONB,
    "accessibility_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "travel_preferences_pkey" PRIMARY KEY ("group_id")
);

-- CreateIndex
CREATE INDEX "travel_groups_owner_user_id_idx" ON "travel_groups"("owner_user_id");

-- CreateIndex
CREATE INDEX "travel_groups_owner_user_id_default_group_idx" ON "travel_groups"("owner_user_id", "default_group");

-- CreateIndex
CREATE INDEX "travel_groups_deleted_at_idx" ON "travel_groups"("deleted_at");

-- CreateIndex
CREATE INDEX "travel_members_group_id_idx" ON "travel_members"("group_id");

-- CreateIndex
CREATE INDEX "pets_group_id_idx" ON "pets"("group_id");

-- CreateIndex
CREATE INDEX "trips_travel_group_id_idx" ON "trips"("travel_group_id");

-- AddForeignKey
ALTER TABLE "travel_groups" ADD CONSTRAINT "travel_groups_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_members" ADD CONSTRAINT "travel_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "travel_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "travel_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_preferences" ADD CONSTRAINT "travel_preferences_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "travel_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_travel_group_id_fkey" FOREIGN KEY ("travel_group_id") REFERENCES "travel_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
