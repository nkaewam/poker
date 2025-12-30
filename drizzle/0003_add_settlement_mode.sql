ALTER TABLE "games"
ADD COLUMN "settlement_mode" varchar DEFAULT 'PEER_TO_PEER' NOT NULL;

ALTER TABLE "games"
ADD COLUMN "collector_player_id" uuid REFERENCES "players"("id") ON DELETE SET NULL;
