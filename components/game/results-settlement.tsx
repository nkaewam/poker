"use client";

import { useState } from "react";
import {
  calculateSettlement,
  type PlayerResult,
  type SettlementMode,
} from "@/lib/settlement";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlayerIcon } from "@/components/game/player-icon";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UpdateSettlementModeRequest } from "@/lib/api/schemas";

interface ResultsSettlementProps {
  results: PlayerResult[];
  playerNames: Record<string, string>;
  settlementMode: SettlementMode;
  collectorPlayerId: string | null;
  players: Array<{ id: string; name: string }>;
  onUpdateSettlementMode: (request: UpdateSettlementModeRequest) => void;
  isUpdatingSettlementMode?: boolean;
}

export function ResultsSettlement({
  results,
  playerNames,
  settlementMode,
  collectorPlayerId,
  players,
  onUpdateSettlementMode,
  isUpdatingSettlementMode = false,
}: ResultsSettlementProps) {
  const [localCollectorId, setLocalCollectorId] = useState<string>(
    collectorPlayerId || ""
  );

  const settlement = calculateSettlement(
    results,
    settlementMode,
    collectorPlayerId
  );

  const totalBuyIns = results.reduce(
    (sum, r) => sum + (r.net < 0 ? Math.abs(r.net) : 0),
    0
  );

  const handleCopyTransfer = (from: string, to: string, amount: number) => {
    const text = `${playerNames[from]} → ${playerNames[to]}: ${formatCurrency(
      amount
    )}`;
    navigator.clipboard.writeText(text);
  };

  const handleCopyAll = () => {
    const lines = settlement.map(
      (t) =>
        `${playerNames[t.fromId]} → ${playerNames[t.toId]}: ${formatCurrency(
          t.amount
        )}`
    );
    navigator.clipboard.writeText(lines.join("\n"));
  };

  const handleModeChange = (newMode: SettlementMode) => {
    if (newMode === settlementMode) return;

    if (newMode === "COLLECTOR") {
      // If switching to COLLECTOR and no collector selected, use first player
      const collectorId = localCollectorId || players[0]?.id;
      if (!collectorId) {
        return; // Can't set collector mode without players
      }
      onUpdateSettlementMode({
        settlementMode: newMode,
        collectorPlayerId: collectorId,
      });
      setLocalCollectorId(collectorId);
    } else {
      onUpdateSettlementMode({
        settlementMode: newMode,
        collectorPlayerId: null,
      });
    }
  };

  const handleCollectorChange = (newCollectorId: string) => {
    setLocalCollectorId(newCollectorId);
    onUpdateSettlementMode({
      settlementMode: "COLLECTOR",
      collectorPlayerId: newCollectorId,
    });
  };

  const currentCollectorName =
    collectorPlayerId && playerNames[collectorPlayerId]
      ? playerNames[collectorPlayerId]
      : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-lg font-bold">
        <span>Total Buy-ins:</span>
        <span className="font-medium">{formatCurrency(totalBuyIns)}</span>
      </div>

      <Separator />

      {/* Settlement Mode Selection */}
      <div className="space-y-3 p-4 rounded-md border bg-card">
        <div className="flex items-center justify-between">
          <Label htmlFor="settlement-mode" className="text-sm font-semibold">
            Settlement Mode
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdatingSettlementMode}
              >
                {settlementMode === "COLLECTOR" ? "Collector" : "Peer-to-Peer"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleModeChange("PEER_TO_PEER")}
                className={settlementMode === "PEER_TO_PEER" ? "bg-accent" : ""}
              >
                Peer-to-Peer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleModeChange("COLLECTOR")}
                className={settlementMode === "COLLECTOR" ? "bg-accent" : ""}
                disabled={players.length === 0}
              >
                Collector
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {settlementMode === "COLLECTOR" && (
          <div className="space-y-2">
            <Select
              value={localCollectorId || ""}
              onValueChange={handleCollectorChange}
              disabled={isUpdatingSettlementMode || players.length === 0}
            >
              <SelectTrigger
                id="collector-select"
                className="w-full border-border"
              >
                <SelectValue placeholder="Select collector...">
                  {localCollectorId && (
                    <div className="flex items-center gap-2">
                      <PlayerIcon
                        playerId={localCollectorId}
                        size={16}
                        className="shrink-0"
                      />
                      <span>{playerNames[localCollectorId]}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="w-[var(--radix-select-trigger-width)]"
              >
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    <div className="flex items-center gap-2">
                      <PlayerIcon
                        playerId={player.id}
                        size={16}
                        className="shrink-0"
                      />
                      <span>{player.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!collectorPlayerId && players.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Please select a collector to proceed with collector mode.
              </p>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Settlement</h2>
          {settlement.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
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
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <PlayerIcon playerId={transfer.fromId} size={24} />
                    <span className="font-medium">
                      {playerNames[transfer.fromId]}
                    </span>
                  </div>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <div className="flex items-center gap-1.5">
                    <PlayerIcon playerId={transfer.toId} size={24} />
                    <span className="font-medium">
                      {playerNames[transfer.toId]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {formatCurrency(transfer.amount)}
                  </span>
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
