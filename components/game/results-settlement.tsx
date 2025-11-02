"use client";

import { calculateSettlement, type PlayerResult } from "@/lib/settlement";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ResultsSettlementProps {
  results: PlayerResult[];
  playerNames: Record<string, string>;
}

export function ResultsSettlement({
  results,
  playerNames,
}: ResultsSettlementProps) {
  const settlement = calculateSettlement(results);
  
  const totalBuyIns = results.reduce(
    (sum, r) => sum + (r.net < 0 ? Math.abs(r.net) : 0),
    0
  );
  const totalWinnings = results.reduce(
    (sum, r) => sum + (r.net > 0 ? r.net : 0),
    0
  );
  
  const handleCopyTransfer = (from: string, to: string, amount: number) => {
    const text = `${playerNames[from]} → ${playerNames[to]}: ${formatCurrency(amount)}`;
    navigator.clipboard.writeText(text);
  };
  
  const handleCopyAll = () => {
    const lines = settlement.map(
      (t) =>
        `${playerNames[t.fromId]} → ${playerNames[t.toId]}: ${formatCurrency(t.amount)}`
    );
    navigator.clipboard.writeText(lines.join("\n"));
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-3">Results</h2>
        <div className="space-y-2">
          {results.map((result) => {
            const isPositive = result.net > 0;
            return (
              <div
                key={result.playerId}
                className="flex items-center justify-between p-3 rounded-md border bg-card"
              >
                <span className="font-medium">{playerNames[result.playerId]}</span>
                <span
                  className={`font-semibold ${
                    isPositive
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {formatCurrency(result.net)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <Separator />
      
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Total Buy-ins:</span>
          <span className="font-medium">{formatCurrency(totalBuyIns)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Winnings:</span>
          <span className="font-medium">{formatCurrency(totalWinnings)}</span>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Settlement</h2>
          {settlement.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
            >
              Copy All
            </Button>
          )}
        </div>
        
        {settlement.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transfers needed - all players are settled.
          </p>
        ) : (
          <div className="space-y-2">
            {settlement.map((transfer, idx) => (
              <div
                key={`${transfer.fromId}-${transfer.toId}-${idx}`}
                className="flex items-center justify-between p-3 rounded-md border bg-card"
              >
                <div className="flex-1">
                  <span className="font-medium">{playerNames[transfer.fromId]}</span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="font-medium">{playerNames[transfer.toId]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(transfer.amount)}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      handleCopyTransfer(
                        transfer.fromId,
                        transfer.toId,
                        transfer.amount
                      )
                    }
                    aria-label="Copy transfer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

