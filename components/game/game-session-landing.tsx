"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateGame, useJoinGame, useLastPlayerName } from "@/lib/api/hooks";

type Flow = "initial" | "create" | "join";

const playerNameSchema = z.object({
  playerName: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

const joinFormSchema = z.object({
  gameCode: z
    .string()
    .min(5, "Game code must be 5 characters")
    .max(5, "Game code must be 5 characters")
    .regex(/^[A-Z0-9]+$/, "Game code must contain only letters and numbers"),
  playerName: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

type PlayerNameFormValues = z.infer<typeof playerNameSchema>;
type JoinFormValues = z.infer<typeof joinFormSchema>;

export function GameSessionLanding() {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow>("initial");

  const createGameMutation = useCreateGame();
  const joinGameMutation = useJoinGame();
  const { data: lastPlayerNameData } = useLastPlayerName();

  const createForm = useForm<PlayerNameFormValues>({
    resolver: zodResolver(playerNameSchema),
    defaultValues: {
      playerName: "",
    },
  });

  const joinForm = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: {
      gameCode: "",
      playerName: "",
    },
  });

  // Prefill name when flow changes or when last player name loads
  useEffect(() => {
    if (lastPlayerNameData?.name) {
      if (flow === "create") {
        createForm.setValue("playerName", lastPlayerNameData.name);
      } else if (flow === "join") {
        joinForm.setValue("playerName", lastPlayerNameData.name);
      }
    }
  }, [flow, lastPlayerNameData, createForm, joinForm]);

  const handleCreateGame = () => {
    setFlow("create");
    // Prefill name if available
    if (lastPlayerNameData?.name) {
      createForm.setValue("playerName", lastPlayerNameData.name);
    }
  };

  const handleJoinGame = () => {
    setFlow("join");
    // Prefill name if available
    if (lastPlayerNameData?.name) {
      joinForm.setValue("playerName", lastPlayerNameData.name);
    }
  };

  const handleCreateSubmit = async (data: PlayerNameFormValues) => {
    try {
      const game = await createGameMutation.mutateAsync({
        playerName: data.playerName.trim(),
      });
      router.push(`/g/${game.gameCode}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      // Error will be shown via form validation or we could add a toast
    }
  };

  const handleJoinSubmit = async (data: JoinFormValues) => {
    try {
      const game = await joinGameMutation.mutateAsync({
        gameCode: data.gameCode.trim().toUpperCase(),
        playerName: data.playerName.trim(),
      });
      router.push(`/g/${game.gameCode}`);
    } catch (error) {
      console.error("Failed to join game:", error);
      joinForm.setError("gameCode", {
        type: "manual",
        message: error instanceof Error ? error.message : "Failed to join game",
      });
    }
  };

  // Initial screen - choose to create or join
  if (flow === "initial") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Poker Accounting</h1>
            <p className="text-muted-foreground">
              Create a game or join an existing session
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleCreateGame}
              className="w-full"
              size="lg"
            >
              Create Game
            </Button>
            <Button
              onClick={handleJoinGame}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Join Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Create game flow - enter name
  if (flow === "create") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Create Game</h1>
            <p className="text-muted-foreground">
              Enter your name to start
            </p>
          </div>

          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(handleCreateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        className="text-center"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={createGameMutation.isPending}
              >
                {createGameMutation.isPending ? "Creating..." : "Create Game"}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setFlow("initial");
                  createForm.reset();
                }}
                variant="ghost"
                className="w-full"
              >
                Back
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  // Join game flow - enter code and name together
  if (flow === "join") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Join Game</h1>
            <p className="text-muted-foreground">
              Enter the game code and your name
            </p>
          </div>

          <Form {...joinForm}>
            <form
              onSubmit={joinForm.handleSubmit(handleJoinSubmit)}
              className="space-y-4"
            >
              <FormField
                control={joinForm.control}
                name="gameCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Code</FormLabel>
                    <FormControl>
                      <InputOTP
                        maxLength={5}
                        value={field.value}
                        onChange={(value) => {
                          // Filter to only allow alphanumeric and convert to uppercase
                          const filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                          field.onChange(filtered);
                        }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={joinForm.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        className="text-center"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={joinGameMutation.isPending}
              >
                {joinGameMutation.isPending ? "Joining..." : "Join Game"}
              </Button>
              
              <Button
                type="button"
                onClick={() => {
                  setFlow("initial");
                  joinForm.reset();
                }}
                variant="ghost"
                className="w-full"
              >
                Back
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  return null;
}

