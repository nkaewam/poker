import { useMemo } from "react";
import { type GameState } from "@/lib/storage";
import { type PlayerResult } from "@/lib/settlement";
import { transformGameToState } from "@/lib/api/transform";
import { useGame } from "@/lib/api/hooks";

export function useGameState(gameCode: string | undefined) {
  const { data: game, isLoading, error } = useGame(gameCode);

  // Transform API response to component state format
  const state = useMemo<GameState>(() => {
    if (!game) {
      return { players: [], buyIns: {}, finals: {} };
    }
    return transformGameToState(game);
  }, [game]);

  // Calculate results
  const playerNames = useMemo(
    () => Object.fromEntries(state.players.map((p) => [p.id, p.name])),
    [state.players]
  );

  const results = useMemo<PlayerResult[]>(() => {
    return state.players.map((player) => {
      const totalBuyIns = (state.buyIns[player.id] || []).reduce(
        (sum, amount) => sum + amount,
        0
      );
      const final = state.finals[player.id] ?? 0;
      const net = final - totalBuyIns;

      return {
        playerId: player.id,
        net,
        final,
      };
    });
  }, [state]);

  // Check if all finals are entered
  const allFinalsEntered = useMemo(
    () =>
      state.players.every(
        (p) => state.finals[p.id] !== null && state.finals[p.id] !== undefined
      ),
    [state]
  );

  // Calculate totals for discrepancy check
  const totalBuyIns = useMemo(
    () =>
      state.players.reduce(
        (sum, p) => sum + (state.buyIns[p.id] || []).reduce((s, a) => s + a, 0),
        0
      ),
    [state]
  );

  const totalFinals = useMemo(
    () => state.players.reduce((sum, p) => sum + (state.finals[p.id] ?? 0), 0),
    [state]
  );

  const discrepancy = useMemo(
    () => Math.abs(totalFinals - totalBuyIns),
    [totalFinals, totalBuyIns]
  );

  const settlementMode = useMemo(
    () => game?.settlementMode || "PEER_TO_PEER",
    [game]
  );

  const collectorPlayerId = useMemo(
    () => game?.collectorPlayerId || null,
    [game]
  );

  return {
    game,
    state,
    playerNames,
    results,
    allFinalsEntered,
    totalBuyIns,
    totalFinals,
    discrepancy,
    buyInAmount: game?.buyInAmount ? parseFloat(game.buyInAmount) : null,
    settlementMode,
    collectorPlayerId,
    isLoading,
    error,
  };
}
