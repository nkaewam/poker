"use client";

import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { GameManager } from "@/components/game/game-manager";

export default function GameSessionPage() {
  const params = useParams();
  const gameCode = params.gameCode as string;
  const [playerName] = useQueryState("playerName");

  return <GameManager gameCode={gameCode} playerName={playerName || undefined} />;
}

