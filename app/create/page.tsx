"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateGame, useLastPlayerName } from "@/lib/api/hooks";
import { Spinner } from "@/components/ui/spinner";

const playerNameSchema = z.object({
  playerName: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

type PlayerNameFormValues = z.infer<typeof playerNameSchema>;

export default function CreateGamePage() {
  const router = useRouter();
  const createGameMutation = useCreateGame();
  const { data: lastPlayerNameData } = useLastPlayerName();

  const form = useForm<PlayerNameFormValues>({
    resolver: zodResolver(playerNameSchema),
    defaultValues: {
      playerName: "",
    },
  });

  // Prefill name when last player name loads
  useEffect(() => {
    if (lastPlayerNameData?.name && !form.getValues("playerName")) {
      form.setValue("playerName", lastPlayerNameData.name);
    }
  }, [lastPlayerNameData, form]);

  const handleSubmit = async (data: PlayerNameFormValues) => {
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create Game</h1>
          <p className="text-muted-foreground">
            Enter your name to start
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
              {createGameMutation.isPending && <Spinner className="mr-2" />}
              {createGameMutation.isPending ? "Creating..." : "Create Game"}
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

