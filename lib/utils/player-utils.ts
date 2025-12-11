import type { GameState } from "@/lib/storage";

/**
 * Determine if a player is a "guest" (manually created in-game)
 * A player is a guest if:
 * - They have a sessionId
 * - There's at least one other player in the game with the same sessionId
 * - They were created after at least one other player with the same sessionId
 */
export function isGuestPlayer(playerId: string, state: GameState): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.sessionId) {
    return false;
  }

  // Find all players with the same sessionId
  const playersWithSameSession = state.players.filter(
    (p) => p.sessionId === player.sessionId && p.id !== playerId
  );

  // If no other players with same session, not a guest
  if (playersWithSameSession.length === 0) {
    return false;
  }

  // Check if this player was created after at least one other player with the same session
  const playerCreatedAt = new Date(player.createdAt).getTime();
  const hasEarlierPlayer = playersWithSameSession.some(
    (p) => new Date(p.createdAt).getTime() < playerCreatedAt
  );

  return hasEarlierPlayer;
}
