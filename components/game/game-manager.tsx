"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ResultsSettlement } from "@/components/game/results-settlement";
import { type GameState } from "@/lib/storage";
import { formatCurrency, parseCurrency } from "@/lib/format";
import { type PlayerResult } from "@/lib/settlement";
import {
  useGame,
  useAddPlayer,
  useUpdatePlayer,
  useAddBuyIn,
  useRemoveBuyIn,
  useUpdateFinal,
} from "@/lib/api/hooks";
import { transformGameToState } from "@/lib/api/transform";

type Tab = "players" | "buyins" | "finals" | "results";

interface GameManagerProps {
  gameCode?: string;
  playerName?: string;
}

export function GameManager({ gameCode, playerName }: GameManagerProps) {
  const router = useRouter();
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "players",
    parse: (value) => {
      const valid: Tab[] = ["players", "buyins", "finals", "results"];
      return valid.includes(value as Tab) ? (value as Tab) : "players";
    },
    serialize: (value) => value,
  });
  const [isQrCodeOpen, setIsQrCodeOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Construct join URL for QR code
  const joinUrl = useMemo(() => {
    if (!gameCode || typeof window === "undefined") return "";
    return `${window.location.origin}/join?game-code=${gameCode}`;
  }, [gameCode]);

  // Fetch game data with polling
  const { data: game, isLoading, error } = useGame(gameCode);

  // Transform API response to component state format
  const state = useMemo<GameState>(() => {
    if (!game) {
      return { players: [], buyIns: {}, finals: {} };
    }
    return transformGameToState(game);
  }, [game]);

  // Mutations
  const addPlayerMutation = useAddPlayer(gameCode || "");
  const updatePlayerMutation = useUpdatePlayer(gameCode || "");
  const addBuyInMutation = useAddBuyIn(gameCode || "");
  const removeBuyInMutation = useRemoveBuyIn(gameCode || "");
  const updateFinalMutation = useUpdateFinal(gameCode || "");

  const handleLeaveGame = useCallback(() => {
    setIsLeaveDialogOpen(false);
    router.push("/");
  }, [router]);

  const handleCopyGameCode = useCallback(() => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode);
      setIsCopied(true);
      toast.success("Game code copied to clipboard");
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  }, [gameCode]);

  // Auto-add player when joining with a name (only if game exists and no players)
  useEffect(() => {
    if (playerName && game && state.players.length === 0) {
      addPlayerMutation.mutate({ name: playerName });
    }
  }, [playerName, game, state.players.length, addPlayerMutation]);

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isQrCodeOpen) {
      setIsCopied(false);
    }
  }, [isQrCodeOpen]);

  const updatePlayerName = useCallback(
    (id: string, name: string) => {
      if (!gameCode) return;
      updatePlayerMutation.mutate({ playerId: id, name: name.trim() });
    },
    [gameCode, updatePlayerMutation]
  );

  const addBuyIn = useCallback(
    (playerId: string, amount: number) => {
      if (amount <= 0 || !gameCode) return;
      addBuyInMutation.mutate({ playerId, amount });
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
        removeBuyInMutation.mutate({
          playerId,
          buyInId: playerBuyIns[index].id,
        });
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

  // Calculate results
  const playerNames = Object.fromEntries(
    state.players.map((p) => [p.id, p.name])
  );

  const results: PlayerResult[] = state.players.map((player) => {
    const totalBuyIns = (state.buyIns[player.id] || []).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const final = state.finals[player.id] ?? 0;
    const net = final - totalBuyIns;

    return {
      playerId: player.id,
      net,
    };
  });

  // Check if all finals are entered
  const allFinalsEntered = state.players.every(
    (p) => state.finals[p.id] !== null && state.finals[p.id] !== undefined
  );

  // Calculate totals for discrepancy check
  const totalBuyIns = state.players.reduce(
    (sum, p) =>
      sum + (state.buyIns[p.id] || []).reduce((s, a) => s + a, 0),
    0
  );
  const totalFinals = state.players.reduce(
    (sum, p) => sum + (state.finals[p.id] ?? 0),
    0
  );
  const discrepancy = Math.abs(totalFinals - totalBuyIns);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "players", label: "Players" },
    { id: "buyins", label: "Buy-ins" },
    { id: "finals", label: "Finals" },
    { id: "results", label: "Results" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameCode) {
    return (
      <div className="min-h-screen bg-background p-4 pb-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-red-600">
            {error instanceof Error
              ? error.message
              : "Failed to load game. Please check the game code."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">Poker Accounting</h1>
              {gameCode && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Game Code</span>
                  <button
                    onClick={() => setIsQrCodeOpen(true)}
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
                onClick={() => setIsLeaveDialogOpen(true)}
                className="w-fit"
              >
                Leave Game
              </Button>
            )}
          </div>
        </div>

        {/* QR Code Modal */}
        {gameCode && (
          <Dialog open={isQrCodeOpen} onOpenChange={setIsQrCodeOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Scan to Join Game</DialogTitle>
                <DialogDescription>
                  Share this QR code so others can join the game
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                {joinUrl && (
                  <div className="rounded-lg border-2 border-foreground/20 p-4 bg-white">
                    <QRCodeSVG
                      value={joinUrl}
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                )}
                <div className="text-center space-y-2 w-full">
                  <p className="text-sm text-muted-foreground">Game Code</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-2xl font-mono font-bold">{gameCode}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyGameCode}
                      className="h-9 w-9 p-0"
                      aria-label="Copy game code"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Leave Game Confirmation Dialog */}
        {gameCode && (
          <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Leave Game?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to leave this game? You can rejoin later using the game code.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="rounded-md border bg-card p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Game Code</p>
                  <code className="text-2xl font-mono font-bold">{gameCode}</code>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Save this code to rejoin the game later.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsLeaveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeaveGame}
                >
                  Leave Game
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel 1: Players */}
        {tab === "players" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-3">Players ({state.players.length})</h2>
              {state.players.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No players yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {state.players.map((player) => (
                    <PlayerItem
                      key={player.id}
                      player={player}
                      onUpdateName={(name) => updatePlayerName(player.id, name)}
                      isLoading={updatePlayerMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel 2: Buy-ins */}
        {tab === "buyins" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">Buy-ins</h2>
            {state.players.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Add players first to track buy-ins.
              </p>
            ) : (
              <div className="space-y-4">
                {state.players.map((player) => {
                  const buyIns = state.buyIns[player.id] || [];
                  const total = buyIns.reduce((sum, amount) => sum + amount, 0);

                  return (
                    <BuyInSection
                      key={player.id}
                      playerName={player.name}
                      buyIns={buyIns}
                      total={total}
                      onAdd={(amount) => addBuyIn(player.id, amount)}
                      onRemove={(index) => removeBuyIn(player.id, index)}
                      isAddingLoading={addBuyInMutation.isPending}
                      isRemovingLoading={removeBuyInMutation.isPending}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Panel 3: Finals */}
        {tab === "finals" && (
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
                        playerName={player.name}
                        totalBuyIns={totalBuyIns}
                        value={final ?? null}
                        onChange={(value) => updateFinal(player.id, value)}
                        isLoading={updateFinalMutation.isPending}
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
                        ⚠️ Discrepancy: {formatCurrency(discrepancy)} between buy-ins and finals.
                      </p>
                    </div>
                  )}
                </div>
                {allFinalsEntered && discrepancy <= 0.01 && (
                  <Button
                    className="w-full"
                    onClick={() => setTab("results")}
                  >
                    View Results & Settlement
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Panel 4: Results & Settlement */}
        {tab === "results" && (
          <ResultsSettlement results={results} playerNames={playerNames} />
        )}
      </div>
    </div>
  );
}

// Sub-components

interface PlayerItemProps {
  player: { id: string; name: string };
  onUpdateName: (name: string) => void;
  isLoading?: boolean;
}

function PlayerItem({ player, onUpdateName, isLoading = false }: PlayerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(player.name);

  useEffect(() => {
    setName(player.name);
  }, [player.name]);

  const handleSave = () => {
    if (name.trim()) {
      onUpdateName(name);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(player.name);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card p-3">
      {isEditing ? (
        <>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
          />
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isLoading}>
            {isLoading && <Spinner className="mr-2" />}
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 font-medium">{player.name}</span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={isLoading}>
            Edit
          </Button>
        </>
      )}
    </div>
  );
}

interface BuyInSectionProps {
  playerName: string;
  buyIns: number[];
  total: number;
  onAdd: (amount: number) => void;
  onRemove: (index: number) => void;
  isAddingLoading?: boolean;
  isRemovingLoading?: boolean;
}

function BuyInSection({
  playerName,
  buyIns,
  total,
  onAdd,
  onRemove,
  isAddingLoading = false,
  isRemovingLoading = false,
}: BuyInSectionProps) {
  const [customAmount, setCustomAmount] = useState("");

  const handleCustomAdd = () => {
    const amount = parseCurrency(customAmount);
    if (amount > 0) {
      onAdd(amount);
      setCustomAmount("");
    }
  };

  const isLoading = isAddingLoading || isRemovingLoading;

  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{playerName}</h3>
        <span className="text-sm text-muted-foreground">
          Total: {formatCurrency(total)}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="w-full sm:w-auto">
          <ButtonGroup className="w-full sm:w-auto">
            <Button variant="outline" onClick={() => onAdd(100)} disabled={isLoading}>
              {isAddingLoading && <Spinner className="mr-2" />}
              +฿100
            </Button>
            <Button variant="outline" onClick={() => onAdd(200)} disabled={isLoading}>
              {isAddingLoading && <Spinner className="mr-2" />}
              +฿200
            </Button>
            <Button variant="outline" onClick={() => onAdd(300)} disabled={isLoading}>
              {isAddingLoading && <Spinner className="mr-2" />}
              +฿300
            </Button>
          </ButtonGroup>
        </div>
        <div className="w-full sm:flex-1 sm:min-w-[200px]">
          <ButtonGroup className="w-full">
            <Input
              type="text"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              disabled={isAddingLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAddingLoading) handleCustomAdd();
              }}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleCustomAdd} disabled={isLoading}>
              {isAddingLoading && <Spinner className="mr-2" />}
              Add
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {buyIns.length > 0 && (
        <div className="space-y-1 pt-2 border-t">
          {buyIns.map((amount, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">
                Buy-in #{index + 1}: {formatCurrency(amount)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                disabled={isRemovingLoading}
              >
                {isRemovingLoading && <Spinner className="mr-2" />}
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FinalInputProps {
  playerName: string;
  totalBuyIns: number;
  value: number | null;
  onChange: (value: number | null) => void;
  isLoading?: boolean;
}

function FinalInput({
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
          <span className="font-semibold">{playerName}</span>
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
            className={`font-semibold ${value - totalBuyIns >= 0
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

