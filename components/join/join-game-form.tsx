"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  useJoinGame,
  useLastPlayerName,
  useUserNickname,
} from "@/lib/api/hooks";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/auth/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getCurrentGames } from "@/lib/api/client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { joinFormSchema, JoinFormValues } from "./join-game-schema";
import { JoinGameHeader } from "./join-game-header";
import { GameCodeField } from "./game-code-field";
import { PlayerNameField } from "./player-name-field";
import { ExistingGamesDialog } from "./existing-games-dialog";
import { useJoinGameForm } from "./hooks/use-join-game-form";

export function JoinGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinGameMutation = useJoinGame();
  const { data: lastPlayerNameData } = useLastPlayerName();
  const { data: nicknameData } = useUserNickname();
  const { isAuthenticated } = useAuth();
  const hasNickname = !!nicknameData?.nickname;
  const shouldSkipNicknameInput = isAuthenticated && hasNickname;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { data: currentGamesData } = useQuery({
    queryKey: ["current-games"],
    queryFn: getCurrentGames,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const gameCodeParam = searchParams.get("game-code");

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: {
      gameCode: gameCodeParam?.toUpperCase() || "",
      playerName: "",
    },
  });

  useJoinGameForm({
    form,
    gameCodeParam,
    nickname: nicknameData?.nickname || "",
    lastPlayerName: lastPlayerNameData?.name || "",
    shouldSkipNicknameInput,
  });

  const handleSubmit = async (data: JoinFormValues) => {
    try {
      const game = await joinGameMutation.mutateAsync({
        gameCode: data.gameCode.trim().toUpperCase(),
        playerName: data.playerName.trim(),
      });
      router.push(`/g/${game.gameCode}`);
    } catch (error) {
      console.error("Failed to join game:", error);
      form.setError("gameCode", {
        type: "manual",
        message: error instanceof Error ? error.message : "Failed to join game",
      });
    }
  };

  const [isExistingGamesOpen, setIsExistingGamesOpen] = useState(false);

  useEffect(() => {
    const shouldOpen =
      currentGamesData &&
      currentGamesData.length > 0 &&
      !form.formState.isDirty;
    setIsExistingGamesOpen(!!shouldOpen);
  }, [currentGamesData, form.formState.isDirty]);

  const handleSelectGame = (gameCode: string) => {
    form.setValue("gameCode", gameCode);
    setIsExistingGamesOpen(false);
  };

  return (
    <>
      {currentGamesData && currentGamesData.length > 0 && (
        <ExistingGamesDialog
          open={isExistingGamesOpen}
          onOpenChange={setIsExistingGamesOpen}
          games={currentGamesData.map((game) => ({
            id: game.id.toString(),
            gameCode: game.gameCode,
            buyInAmount: game.buyInAmount?.toString() || null,
            createdAt: game.createdAt,
          }))}
          onSelectGame={handleSelectGame}
          isDesktop={isDesktop}
        />
      )}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <JoinGameHeader shouldSkipNicknameInput={shouldSkipNicknameInput} />

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <GameCodeField form={form} />

              <PlayerNameField
                form={form}
                shouldSkipNicknameInput={shouldSkipNicknameInput}
                nickname={nicknameData?.nickname || ""}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={joinGameMutation.isPending}
              >
                {joinGameMutation.isPending && <Spinner className="mr-2" />}
                {joinGameMutation.isPending ? "Joining..." : "Join Game"}
              </Button>

              <Button type="button" asChild variant="ghost" className="w-full">
                <Link href="/">Back</Link>
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
