"use client";

import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  gameCode?: string;
  onShowQrCode: () => void;
  onShowLeaveDialog: () => void;
}

export function GameHeader({
  gameCode,
  onShowQrCode,
  onShowLeaveDialog,
}: GameHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Poker Accounting</h1>
          {gameCode && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Game Code</span>
              <button
                onClick={onShowQrCode}
                className="block w-fit cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <code className="font-mono text-4xl font-bold text-foreground px-4 py-3 rounded-lg bg-muted border-2 border-foreground/20 hover:border-foreground/40 hover:bg-muted/80 transition-colors inline-block">
                  {gameCode}
                </code>
              </button>
            </div>
          )}
        </div>
        {gameCode && (
          <Button
            variant="outline"
            onClick={onShowLeaveDialog}
            className="w-fit"
          >
            Leave Game
          </Button>
        )}
      </div>
    </div>
  );
}
