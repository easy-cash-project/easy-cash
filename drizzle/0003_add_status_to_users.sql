CREATE TYPE "user_status" AS ENUM('active', 'inactive');
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'active' NOT NULL;
