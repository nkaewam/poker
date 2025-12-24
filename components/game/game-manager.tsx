"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResultsSettlement } from "@/components/game/results-settlement";
import { GameHeader } from "@/components/game/game-header";
import { GameDialogs } from "@/components/game/game-dialogs";
import { PlayersTab } from "@/components/game/players-tab";
import { FinalsTab } from "@/components/game/finals-tab";
import {
  useGameState,
  useGameActions,
  useGameUI,
} from "@/components/game/hooks";

interface GameManagerProps {
  gameCode?: string;
  playerName?: string;
}

export function GameManager({ gameCode, playerName }: GameManagerProps) {
  const router = useRouter();

  // UI state
  const {
    tab,
    setTab,
    tabs,
    isQrCodeOpen,
    setIsQrCodeOpen,
    isLeaveDialogOpen,
    setIsLeaveDialogOpen,
  } = useGameUI();

  // Game state and calculations
  const {
    game,
    state,
    playerNames,
    results,
    allFinalsEntered,
    totalBuyIns,
    totalFinals,
    discrepancy,
    isLoading,
    error,
  } = useGameState(gameCode);

  // Game actions (mutations)
  const {
    updatePlayerName,
    addPlayer,
    addBuyIn,
    removeBuyIn,
    updateFinal,
    isUpdatingName,
    isAddingPlayer,
    isAddingBuyIn,
    loadingBuyIn,
    isRemovingBuyIn,
    removingBuyIn,
    isUpdatingFinal,
  } = useGameActions({
    gameCode,
    game,
    state,
    playerName,
  });

  // Construct join URL for QR code
  const joinUrl = useMemo(() => {
    if (!gameCode || typeof window === "undefined") return "";
    return `${window.location.origin}/join?game-code=${gameCode}`;
  }, [gameCode]);

  const handleLeaveGame = () => {
    router.push("/");
  };

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
        <GameHeader
          gameCode={gameCode}
          onShowQrCode={() => setIsQrCodeOpen(true)}
          onShowLeaveDialog={() => setIsLeaveDialogOpen(true)}
        />

        <GameDialogs
          gameCode={gameCode}
          joinUrl={joinUrl}
          isQrCodeOpen={isQrCodeOpen}
          onQrCodeOpenChange={setIsQrCodeOpen}
          isLeaveDialogOpen={isLeaveDialogOpen}
          onLeaveDialogOpenChange={setIsLeaveDialogOpen}
          onLeaveGame={handleLeaveGame}
        />

        {/* Tabs */}
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as typeof tab)}
          className="mb-6"
        >
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none -mb-px"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="players" className="mt-6">
            <PlayersTab
              state={state}
              onUpdatePlayerName={updatePlayerName}
              onAddBuyIn={addBuyIn}
              onRemoveBuyIn={removeBuyIn}
              onAddPlayer={addPlayer}
              isUpdatingName={isUpdatingName}
              isAddingBuyIn={isAddingBuyIn}
              loadingBuyIn={loadingBuyIn}
              isRemovingBuyIn={isRemovingBuyIn}
              removingBuyIn={removingBuyIn}
              isAddingPlayer={isAddingPlayer}
            />
          </TabsContent>

          <TabsContent value="finals" className="mt-6">
            <FinalsTab
              state={state}
              totalBuyIns={totalBuyIns}
              totalFinals={totalFinals}
              discrepancy={discrepancy}
              allFinalsEntered={allFinalsEntered}
              onUpdateFinal={updateFinal}
              onViewResults={() => setTab("results")}
              isUpdatingFinal={isUpdatingFinal}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ResultsSettlement results={results} playerNames={playerNames} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
