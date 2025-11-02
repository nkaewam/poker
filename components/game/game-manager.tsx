"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryState } from "nuqs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ResultsSettlement } from "@/components/game/results-settlement";
import {
  loadGameState,
  saveGameState,
  clearGameState,
  exportGameState,
  importGameState,
  type GameState,
} from "@/lib/storage";
import { formatCurrency, parseCurrency } from "@/lib/format";
import { type PlayerResult } from "@/lib/settlement";

type Tab = "players" | "buyins" | "finals" | "results";

interface GameManagerProps {
  gameCode?: string;
  playerName?: string;
}

export function GameManager({ gameCode, playerName }: GameManagerProps) {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "players",
    parse: (value) => {
      const valid: Tab[] = ["players", "buyins", "finals", "results"];
      return valid.includes(value as Tab) ? (value as Tab) : "players";
    },
    serialize: (value) => value,
  });

  const [state, setState] = useState<GameState>({
    players: [],
    buyIns: {},
    finals: {},
  });

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadGameState();
    if (loaded) {
      setState(loaded);
    }
  }, []);

  // Auto-add player name when joining with a name (mock behavior)
  useEffect(() => {
    if (playerName && state.players.length === 0) {
      // Only auto-add if no players exist yet (to avoid duplicates on re-renders)
      const id = crypto.randomUUID();
      setState((prev) => ({
        ...prev,
        players: [...prev.players, { id, name: playerName }],
        buyIns: { ...prev.buyIns, [id]: [] },
        finals: { ...prev.finals, [id]: null },
      }));
    }
  }, [playerName, state.players.length]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state.players.length > 0 || Object.keys(state.buyIns).length > 0) {
      saveGameState(state);
    }
  }, [state]);

  const addPlayer = useCallback((name: string) => {
    if (!name.trim()) return;

    const id = crypto.randomUUID();
    setState((prev) => ({
      ...prev,
      players: [...prev.players, { id, name: name.trim() }],
      buyIns: { ...prev.buyIns, [id]: [] },
      finals: { ...prev.finals, [id]: null },
    }));
  }, []);

  const removePlayer = useCallback((id: string) => {
    setState((prev) => {
      const newBuyIns = { ...prev.buyIns };
      const newFinals = { ...prev.finals };
      delete newBuyIns[id];
      delete newFinals[id];

      return {
        players: prev.players.filter((p) => p.id !== id),
        buyIns: newBuyIns,
        finals: newFinals,
      };
    });
  }, []);

  const updatePlayerName = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === id ? { ...p, name: name.trim() } : p
      ),
    }));
  }, []);

  const addBuyIn = useCallback((playerId: string, amount: number) => {
    if (amount <= 0) return;

    setState((prev) => ({
      ...prev,
      buyIns: {
        ...prev.buyIns,
        [playerId]: [...(prev.buyIns[playerId] || []), amount],
      },
    }));
  }, []);

  const removeBuyIn = useCallback((playerId: string, index: number) => {
    setState((prev) => ({
      ...prev,
      buyIns: {
        ...prev.buyIns,
        [playerId]: prev.buyIns[playerId]?.filter((_, i) => i !== index) || [],
      },
    }));
  }, []);

  const updateFinal = useCallback((playerId: string, value: number | null) => {
    setState((prev) => ({
      ...prev,
      finals: {
        ...prev.finals,
        [playerId]: value,
      },
    }));
  }, []);

  const handleReset = useCallback(() => {
    if (confirm("Are you sure you want to reset the game? This will clear all data.")) {
      clearGameState();
      setState({
        players: [],
        buyIns: {},
        finals: {},
      });
      setTab("players");
    }
  }, [setTab]);

  const handleExport = useCallback(() => {
    const json = exportGameState(state);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poker-game-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const imported = importGameState(text);
        if (imported) {
          setState(imported);
          alert("Game imported successfully!");
        } else {
          alert("Failed to import game. Invalid file format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

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

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Poker Accounting</h1>
              {gameCode && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Game Code:</span>
                  <code className="font-mono font-semibold text-foreground px-2 py-0.5 rounded bg-muted">
                    {gameCode}
                  </code>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImport}>
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </div>

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
              <h2 className="text-lg font-semibold mb-3">Add Player</h2>
              <PlayerInput onSubmit={addPlayer} />
            </div>
            <Separator />
            <div>
              <h2 className="text-lg font-semibold mb-3">Players ({state.players.length})</h2>
              {state.players.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No players yet. Add your first player above.
                </p>
              ) : (
                <div className="space-y-2">
                  {state.players.map((player) => (
                    <PlayerItem
                      key={player.id}
                      player={player}
                      onUpdateName={(name) => updatePlayerName(player.id, name)}
                      onRemove={() => removePlayer(player.id)}
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

interface PlayerInputProps {
  onSubmit: (name: string) => void;
}

const playerNameSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

type PlayerNameFormValues = z.infer<typeof playerNameSchema>;

function PlayerInput({ onSubmit }: PlayerInputProps) {
  const form = useForm<PlayerNameFormValues>({
    resolver: zodResolver(playerNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleSubmit = (data: PlayerNameFormValues) => {
    onSubmit(data.name.trim());
    form.reset();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex gap-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  placeholder="Player name"
                  className="flex-1"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Add</Button>
      </form>
    </Form>
  );
}

interface PlayerItemProps {
  player: { id: string; name: string };
  onUpdateName: (name: string) => void;
  onRemove: () => void;
}

function PlayerItem({ player, onUpdateName, onRemove }: PlayerItemProps) {
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
          />
          <Button variant="outline" size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 font-medium">{player.name}</span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
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
}

function BuyInSection({
  playerName,
  buyIns,
  total,
  onAdd,
  onRemove,
}: BuyInSectionProps) {
  const [customAmount, setCustomAmount] = useState("");

  const handleCustomAdd = () => {
    const amount = parseCurrency(customAmount);
    if (amount > 0) {
      onAdd(amount);
      setCustomAmount("");
    }
  };

  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{playerName}</h3>
        <span className="text-sm text-muted-foreground">
          Total: {formatCurrency(total)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onAdd(20)}>
          +฿20
        </Button>
        <Button variant="outline" onClick={() => onAdd(50)}>
          +฿50
        </Button>
        <Button variant="outline" onClick={() => onAdd(100)}>
          +฿100
        </Button>
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomAdd();
            }}
            className="flex-1"
          />
          <Button variant="outline" onClick={handleCustomAdd}>
            Add
          </Button>
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
              >
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
}

function FinalInput({
  playerName,
  totalBuyIns,
  value,
  onChange,
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
          <span className="text-xs text-muted-foreground">
            Buy-ins: {formatCurrency(totalBuyIns)}
          </span>
        </div>
      </div>
      <Input
        type="text"
        placeholder="Enter final cashout"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
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

