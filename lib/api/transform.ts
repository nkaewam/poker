import type { GameResponse } from "@/lib/api/schemas";
import type { GameState } from "@/lib/storage";

/**
 * Transform API game response to component state format
 */
export function transformGameToState(game: GameResponse): GameState {
  const buyInsMap: Record<string, number[]> = {};
  const finalsMap: Record<string, number | null> = {};

  // Process buy-ins (sort by creation date to maintain order)
  const sortedBuyIns = [...game.buyIns].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  for (const buyIn of sortedBuyIns) {
    if (!buyInsMap[buyIn.playerId]) {
      buyInsMap[buyIn.playerId] = [];
    }
    buyInsMap[buyIn.playerId].push(parseFloat(buyIn.amount));
  }

  // Process finals
  const finalMap = new Map(game.finals.map((f) => [f.playerId, parseFloat(f.amount)]));
  for (const player of game.players) {
    finalsMap[player.id] = finalMap.get(player.id) ?? null;
  }

  return {
    players: game.players.map((p) => ({ id: p.id, name: p.name })),
    buyIns: buyInsMap,
    finals: finalsMap,
  };
}

