import { db } from "./index";
import { gameLogs } from "./schema";

export type GameLogAction =
  | "game_created"
  | "player_added"
  | "player_name_updated"
  | "buyin_added"
  | "buyin_removed"
  | "final_updated";

export interface GameLogMetadata {
  [key: string]: unknown;
}

export interface CreateGameLogParams {
  gameId: number;
  action: GameLogAction;
  playerId?: string;
  actorSessionId?: string;
  actorPlayerId?: string;
  metadata?: GameLogMetadata;
}

/**
 * Create a game log entry (fire-and-forget, non-blocking)
 */
export function createGameLog(params: CreateGameLogParams) {
  // Fire and forget - don't await, don't block the main operation
  db.insert(gameLogs)
    .values({
      gameId: params.gameId,
      action: params.action,
      playerId: params.playerId ?? null,
      actorSessionId: params.actorSessionId ?? null,
      actorPlayerId: params.actorPlayerId ?? null,
      metadata: params.metadata ?? null,
    })
    .catch((error) => {
      // Log errors but don't throw - logging failures shouldn't break the main operation
      console.error("Failed to create game log:", error);
    });
}
