-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL DEFAULT '',
    "last_name" VARCHAR(100) NOT NULL DEFAULT '',
    "language" CHAR(2) NOT NULL DEFAULT 'fr',
    "country" CHAR(2) NOT NULL DEFAULT 'CA',
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'America/Toronto',
    "travel_style" VARCHAR(50),
    "budget_level" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" UUID NOT NULL,
    "distance_unit" VARCHAR(10) NOT NULL DEFAULT 'km',
    "temperature_unit" VARCHAR(5) NOT NULL DEFAULT 'C',
    "fuel_unit" VARCHAR(20) NOT NULL DEFAULT 'L/100',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "ai_proactive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "user_profiles_country_idx" ON "user_profiles"("country");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
