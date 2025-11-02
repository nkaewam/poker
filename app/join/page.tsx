"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
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
import { useJoinGame, useLastPlayerName } from "@/lib/api/hooks";
import { Spinner } from "@/components/ui/spinner";

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

type JoinFormValues = z.infer<typeof joinFormSchema>;

function JoinGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinGameMutation = useJoinGame();
  const { data: lastPlayerNameData } = useLastPlayerName();

  const gameCodeParam = searchParams.get("game-code");

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: {
      gameCode: gameCodeParam?.toUpperCase() || "",
      playerName: "",
    },
  });

  // Prefill name when last player name loads
  useEffect(() => {
    if (lastPlayerNameData?.name && !form.getValues("playerName")) {
      form.setValue("playerName", lastPlayerNameData.name);
    }
  }, [lastPlayerNameData, form]);

  // Prefill game code from query param
  useEffect(() => {
    if (gameCodeParam) {
      const upperCode = gameCodeParam.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (upperCode.length <= 5) {
        form.setValue("gameCode", upperCode);
      }
    }
  }, [gameCodeParam, form]);

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Join Game</h1>
          <p className="text-muted-foreground">
            Enter the game code and your name
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
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
              control={form.control}
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
              {joinGameMutation.isPending && <Spinner className="mr-2" />}
              {joinGameMutation.isPending ? "Joining..." : "Join Game"}
            </Button>
            
            <Button
              type="button"
              asChild
              variant="ghost"
              className="w-full"
            >
              <Link href="/">Back</Link>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function JoinGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Join Game</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <JoinGameForm />
    </Suspense>
  );
}

