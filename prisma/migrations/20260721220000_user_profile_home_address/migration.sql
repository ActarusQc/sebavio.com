-- Adresse de domicile (planification IA / départ proposé)

ALTER TABLE "user_profiles" ADD COLUMN "home_address_label" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "home_address_place_id" VARCHAR(255);
ALTER TABLE "user_profiles" ADD COLUMN "home_address_latitude" DECIMAL(10,7);
ALTER TABLE "user_profiles" ADD COLUMN "home_address_longitude" DECIMAL(10,7);
ALTER TABLE "user_profiles" ADD COLUMN "home_address_city" VARCHAR(120);
ALTER TABLE "user_profiles" ADD COLUMN "home_address_province" VARCHAR(120);
ALTER TABLE "user_profiles" ADD COLUMN "home_address_postal_code" VARCHAR(20);
ALTER TABLE "user_profiles" ADD COLUMN "home_address_country" VARCHAR(2);
