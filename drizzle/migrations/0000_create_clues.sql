CREATE TYPE "public"."clue_round" AS ENUM('Jeopardy!', 'Double Jeopardy!', 'Final Jeopardy!');--> statement-breakpoint
CREATE TABLE "clues" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"clue" text NOT NULL,
	"answer" text NOT NULL,
	"value" integer,
	"round" "clue_round" NOT NULL,
	"air_date" date
);
--> statement-breakpoint
ALTER TABLE "clues" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "clues_round_air_date_category_idx" ON "clues" USING btree ("round","air_date","category");--> statement-breakpoint
CREATE POLICY "clues are readable by everyone" ON "clues" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);