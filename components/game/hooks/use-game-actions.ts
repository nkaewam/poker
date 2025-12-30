import { useCallback, useEffect, useState } from "react";
import {
  useAddPlayer,
  useUpdatePlayer,
  useAddBuyIn,
  useRemoveBuyIn,
  useUpdateFinal,
  useUpdateSettlementMode,
} from "@/lib/api/hooks";
import type { GameState } from "@/lib/storage";
import type { GameResponse } from "@/lib/api/schemas";
import type { UpdateSettlementModeRequest } from "@/lib/api/schemas";

interface UseGameActionsProps {
  gameCode: string | undefined;
  game: GameResponse | undefined;
  state: GameState;
  playerName?: string;
}

export function useGameActions({
  gameCode,
  game,
  state,
  playerName,
}: UseGameActionsProps) {
  // Mutations
  const addPlayerMutation = useAddPlayer(gameCode || "");
  const updatePlayerMutation = useUpdatePlayer(gameCode || "");
  const addBuyInMutation = useAddBuyIn(gameCode || "");
  const removeBuyInMutation = useRemoveBuyIn(gameCode || "");
  const updateFinalMutation = useUpdateFinal(gameCode || "");
  const updateSettlementModeMutation = useUpdateSettlementMode(gameCode || "");

  // Auto-add player when joining with a name (only if game exists and no players)
  useEffect(() => {
    if (playerName && game && state.players.length === 0) {
      addPlayerMutation.mutate({ name: playerName });
    }
  }, [playerName, game, state.players.length, addPlayerMutation]);

  const updatePlayerName = useCallback(
    (id: string, name: string) => {
      if (!gameCode) return;
      updatePlayerMutation.mutate({ playerId: id, name: name.trim() });
    },
    [gameCode, updatePlayerMutation]
  );

  const addPlayer = useCallback(
    (name: string) => {
      if (!name.trim() || !gameCode) return;
      addPlayerMutation.mutate({ name: name.trim() });
    },
    [gameCode, addPlayerMutation]
  );

  // Track which specific buy-in is being added (playerId + amount)
  const [loadingBuyIn, setLoadingBuyIn] = useState<{
    playerId: string;
    amount: number;
  } | null>(null);

  // Track which specific buy-in is being removed (playerId + index)
  const [removingBuyIn, setRemovingBuyIn] = useState<{
    playerId: string;
    index: number;
  } | null>(null);

  const addBuyIn = useCallback(
    (playerId: string, amount: number) => {
      if (amount <= 0 || !gameCode) return;
      setLoadingBuyIn({ playerId, amount });
      addBuyInMutation.mutate(
        { playerId, amount },
        {
          onSettled: () => {
            setLoadingBuyIn(null);
          },
        }
      );
    },
    [gameCode, addBuyInMutation]
  );

  const removeBuyIn = useCallback(
    (playerId: string, index: number) => {
      if (!gameCode || !game) return;
      // Find the buy-in ID by index (sort by creation date to match order)
      const playerBuyIns = game.buyIns
        .filter((bi) => bi.playerId === playerId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      if (playerBuyIns[index]) {
        setRemovingBuyIn({ playerId, index });
        removeBuyInMutation.mutate(
          {
            playerId,
            buyInId: playerBuyIns[index].id,
          },
          {
            onSettled: () => {
              setRemovingBuyIn(null);
            },
          }
        );
      }
    },
    [gameCode, game, removeBuyInMutation]
  );

  const updateFinal = useCallback(
    (playerId: string, value: number | null) => {
      if (!gameCode) return;
      updateFinalMutation.mutate({
        playerId,
        amount: value ?? 0,
      });
    },
    [gameCode, updateFinalMutation]
  );

  const updateSettlementMode = useCallback(
    (request: UpdateSettlementModeRequest) => {
      if (!gameCode) return;
      updateSettlementModeMutation.mutate(request);
    },
    [gameCode, updateSettlementModeMutation]
  );

  return {
    updatePlayerName,
    addPlayer,
    addBuyIn,
    removeBuyIn,
    updateFinal,
    updateSettlementMode,
    isUpdatingName: updatePlayerMutation.isPending,
    isAddingPlayer: addPlayerMutation.isPending,
    isAddingBuyIn: addBuyInMutation.isPending,
    loadingBuyIn,
    isRemovingBuyIn: removeBuyInMutation.isPending,
    removingBuyIn,
    isUpdatingFinal: updateFinalMutation.isPending,
    isUpdatingSettlementMode: updateSettlementModeMutation.isPending,
  };
}
