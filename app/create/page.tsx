"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthButton } from "@/components/auth/auth-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useCreateGame,
  useLastPlayerName,
  useUserNickname,
} from "@/lib/api/hooks";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/components/auth/auth-provider";

const createGameSchema = z.object({
  playerName: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  buyInAmount: z
    .number({
      message: "Buy-in amount is required",
    })
    .refine((val) => !isNaN(val), {
      message: "Buy-in amount is required",
    })
    .positive("Buy-in amount must be positive"),
});

type CreateGameFormValues = z.infer<typeof createGameSchema>;

export default function CreateGamePage() {
  const router = useRouter();
  const createGameMutation = useCreateGame();
  const { data: lastPlayerNameData } = useLastPlayerName();
  const { data: nicknameData } = useUserNickname();
  const session = authClient.useSession();

  const isAuthenticated = !!session.data?.user;
  const hasNickname = !!nicknameData?.nickname;
  const shouldSkipNicknameInput = isAuthenticated && hasNickname;

  const form = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      playerName: "",
      buyInAmount: undefined,
    },
  });

  // Prefill name: prioritize nickname, then last player name
  useEffect(() => {
    const currentValue = form.getValues("playerName");
    if (currentValue) return; // Don't overwrite if user has typed something

    if (nicknameData?.nickname) {
      form.setValue("playerName", nicknameData.nickname);
    } else if (lastPlayerNameData?.name) {
      form.setValue("playerName", lastPlayerNameData.name);
    }
  }, [nicknameData, lastPlayerNameData, form]);

  const handleSubmit = async (data?: CreateGameFormValues) => {
    try {
      // If authenticated with nickname, use nickname; otherwise use form data
      const playerName = shouldSkipNicknameInput
        ? nicknameData!.nickname!
        : data!.playerName.trim();

      // buyInAmount is required, so it must be present in data
      if (!data?.buyInAmount) {
        return; // Form validation should prevent this, but add safety check
      }

      const game = await createGameMutation.mutateAsync({
        playerName,
        buyInAmount: data.buyInAmount,
      });
      router.push(`/g/${game.gameCode}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      // Error will be shown via form validation or we could add a toast
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <AuthButton />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Create Game</h1>
            <p className="text-muted-foreground">
              {shouldSkipNicknameInput
                ? "Ready to create your game"
                : "Enter your name to start"}
            </p>
          </div>

          {shouldSkipNicknameInput ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Playing as:{" "}
                    <span className="font-semibold">
                      {nicknameData?.nickname}
                    </span>
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="buyInAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy-in Amount (฿)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          className="text-center"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value === "" ? NaN : parseFloat(value)
                            );
                          }}
                          value={isNaN(field.value) ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full text-white"
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
          ) : (
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

                <FormField
                  control={form.control}
                  name="buyInAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy-in Amount (฿)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          className="text-center"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value === "" ? NaN : parseFloat(value)
                            );
                          }}
                          value={isNaN(field.value) ? "" : field.value}
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
          )}
        </div>
      </div>
    </div>
  );
}
