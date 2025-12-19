ALTER TABLE "recurring_payments" ADD COLUMN "created_by_id" varchar;--> statement-breakpoint
UPDATE "recurring_payments" SET "created_by_id" = (SELECT id FROM "users" LIMIT 1);--> statement-breakpoint
ALTER TABLE "recurring_payments" ALTER COLUMN "created_by_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
