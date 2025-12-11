"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, parseCurrency } from "@/lib/format";
import { PlayerIcon } from "@/components/game/player-icon";

interface FinalInputProps {
  playerId: string;
  playerName: string;
  totalBuyIns: number;
  value: number | null;
  onChange: (value: number | null) => void;
  isLoading?: boolean;
}

export function FinalInput({
  playerId,
  playerName,
  totalBuyIns,
  value,
  onChange,
  isLoading = false,
}: FinalInputProps) {
  const [inputValue, setInputValue] = useState(
    value !== null ? value.toString() : ""
  );

  useEffect(() => {
    setInputValue(value !== null ? value.toString() : "");
  }, [value]);

  const handleBlur = () => {
    const parsed = parseCurrency(inputValue);
    onChange(parsed > 0 ? parsed : null);
  };

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <PlayerIcon playerId={playerId} size={32} />
            <span className="font-semibold">{playerName}</span>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            Buy-ins: {formatCurrency(totalBuyIns)}
            {isLoading && <Spinner className="size-3" />}
          </span>
        </div>
      </div>
      <Input
        type="text"
        placeholder="Enter final cashout"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
      />
      {value !== null && (
        <div className="mt-2 text-sm">
          <span className="text-muted-foreground">Net: </span>
          <span
            className={`font-semibold ${
              value - totalBuyIns >= 0
                ? "text-green-600 dark:text-green-500"
                : "text-red-600 dark:text-red-500"
            }`}
          >
            {value - totalBuyIns >= 0 ? "+" : ""}
            {formatCurrency(value - totalBuyIns)}
          </span>
        </div>
      )}
    </div>
  );
}
