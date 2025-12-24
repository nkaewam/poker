CREATE TABLE "game_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "game_id" integer NOT NULL,
    "action" varchar(50) NOT NULL,
    "player_id" uuid,
    "actor_session_id" uuid,
    "actor_player_id" uuid,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_logs"
ADD CONSTRAINT "game_logs_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "game_logs"
ADD CONSTRAINT "game_logs_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE
set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "game_logs"
ADD CONSTRAINT "game_logs_actor_session_id_sessions_id_fk" FOREIGN KEY ("actor_session_id") REFERENCES "public"."sessions"("id") ON DELETE
set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "game_logs"
ADD CONSTRAINT "game_logs_actor_player_id_players_id_fk" FOREIGN KEY ("actor_player_id") REFERENCES "public"."players"("id") ON DELETE
set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "game_log_game_id_idx" ON "game_logs" USING btree ("game_id");
--> statement-breakpoint
CREATE INDEX "game_log_created_at_idx" ON "game_logs" USING btree ("created_at");