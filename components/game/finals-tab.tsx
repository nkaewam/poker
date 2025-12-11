"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type GameState } from "@/lib/storage";
import { formatCurrency } from "@/lib/format";
import { FinalInput } from "./final-input";

interface FinalsTabProps {
  state: GameState;
  totalBuyIns: number;
  totalFinals: number;
  discrepancy: number;
  allFinalsEntered: boolean;
  onUpdateFinal: (playerId: string, value: number | null) => void;
  onViewResults: () => void;
  isUpdatingFinal: boolean;
}

export function FinalsTab({
  state,
  totalBuyIns,
  totalFinals,
  discrepancy,
  allFinalsEntered,
  onUpdateFinal,
  onViewResults,
  isUpdatingFinal,
}: FinalsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-3">Final Cashouts</h2>
      {state.players.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Add players first to enter final cashouts.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {state.players.map((player) => {
              const totalBuyIns = (state.buyIns[player.id] || []).reduce(
                (sum, amount) => sum + amount,
                0
              );
              const final = state.finals[player.id];

              return (
                <FinalInput
                  key={player.id}
                  playerId={player.id}
                  playerName={player.name}
                  totalBuyIns={totalBuyIns}
                  value={final ?? null}
                  onChange={(value) => onUpdateFinal(player.id, value)}
                  isLoading={isUpdatingFinal}
                />
              );
            })}
          </div>
          <Separator />
          <div className="rounded-md border bg-card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Buy-ins:</span>
              <span className="font-medium">{formatCurrency(totalBuyIns)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Finals:</span>
              <span className="font-medium">{formatCurrency(totalFinals)}</span>
            </div>
            {discrepancy > 0.01 && (
              <div className="mt-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Discrepancy: {formatCurrency(discrepancy)} between buy-ins
                  and finals.
                </p>
              </div>
            )}
          </div>
          {allFinalsEntered && discrepancy <= 0.01 && (
            <Button className="w-full" onClick={onViewResults}>
              View Results & Settlement
            </Button>
          )}
        </>
      )}
    </div>
  );
}
