"use client";

import { Suspense } from "react";
import { JoinGameForm } from "@/components/join/join-game-form";

export default function JoinGamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Join Game</h1>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <JoinGameForm />
    </Suspense>
  );
}
