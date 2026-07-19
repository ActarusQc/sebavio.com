-- Phase 2 admin users & support (non-destructive)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_changed_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspension_reason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_by_id" UUID;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspension_ends_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reactivated_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reactivated_by_id" UUID;

CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at");
CREATE INDEX IF NOT EXISTS "users_last_login_at_idx" ON "users"("last_login_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_suspended_by_id_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_suspended_by_id_fkey"
      FOREIGN KEY ("suspended_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_reactivated_by_id_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_reactivated_by_id_fkey"
      FOREIGN KEY ("reactivated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "admin_user_notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "importance" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "admin_user_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_user_notes_user_id_created_at_idx" ON "admin_user_notes"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "admin_user_notes_author_id_idx" ON "admin_user_notes"("author_id");
CREATE INDEX IF NOT EXISTS "admin_user_notes_category_idx" ON "admin_user_notes"("category");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_user_notes_user_id_fkey'
  ) THEN
    ALTER TABLE "admin_user_notes"
      ADD CONSTRAINT "admin_user_notes_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_user_notes_author_id_fkey'
  ) THEN
    ALTER TABLE "admin_user_notes"
      ADD CONSTRAINT "admin_user_notes_author_id_fkey"
      FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
