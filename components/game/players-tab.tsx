"use client";

import { type GameState } from "@/lib/storage";
import { PlayerWithBuyIns } from "./player-with-buyins";
import { AddPlayerForm } from "./add-player-form";

interface PlayersTabProps {
  state: GameState;
  buyInAmount: number | null;
  onUpdatePlayerName: (id: string, name: string) => void;
  onAddBuyIn: (playerId: string, amount: number) => void;
  onRemoveBuyIn: (playerId: string, index: number) => void;
  onAddPlayer: (name: string) => void;
  isUpdatingName: boolean;
  isAddingBuyIn: boolean;
  loadingBuyIn: { playerId: string; amount: number } | null;
  isRemovingBuyIn: boolean;
  removingBuyIn: { playerId: string; index: number } | null;
  isAddingPlayer: boolean;
}

export function PlayersTab({
  state,
  buyInAmount,
  onUpdatePlayerName,
  onAddBuyIn,
  onRemoveBuyIn,
  onAddPlayer,
  isUpdatingName,
  isAddingBuyIn,
  loadingBuyIn,
  isRemovingBuyIn,
  removingBuyIn,
  isAddingPlayer,
}: PlayersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Players & Buy-ins ({state.players.length})
        </h2>
      </div>
      <AddPlayerForm onAdd={onAddPlayer} isLoading={isAddingPlayer} />
      {state.players.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No players yet. Add a player to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {state.players.map((player) => {
            const buyIns = state.buyIns[player.id] || [];
            const total = buyIns.reduce((sum, amount) => sum + amount, 0);

            return (
              <PlayerWithBuyIns
                key={player.id}
                player={player}
                buyIns={buyIns}
                total={total}
                gameState={state}
                buyInAmount={buyInAmount}
                onUpdateName={(name) => onUpdatePlayerName(player.id, name)}
                onAddBuyIn={(amount) => onAddBuyIn(player.id, amount)}
                onRemoveBuyIn={(index) => onRemoveBuyIn(player.id, index)}
                isUpdatingName={isUpdatingName}
                loadingBuyIn={loadingBuyIn}
                removingBuyIn={removingBuyIn}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
