"use client";

import { useState } from "react";
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

type Flow = "initial" | "join";

function generateGameCode(): string {
  // Generate random 5-character alphanumeric code (case-insensitive)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

export function GameSessionLanding() {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow>("initial");

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: {
      gameCode: "",
      playerName: "",
    },
  });

  const handleCreateGame = () => {
    const code = generateGameCode();
    router.push(`/g/${code}`);
  };

  const handleJoinGame = () => {
    setFlow("join");
  };

  const handleJoinSubmit = (data: JoinFormValues) => {
    const code = data.gameCode.trim().toUpperCase();
    const name = data.playerName.trim();
    router.push(`/g/${code}?playerName=${encodeURIComponent(name)}`);
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleJoinSubmit)} className="space-y-4">
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
              >
                Join Game
              </Button>
              
              <Button
                type="button"
                onClick={() => {
                  setFlow("initial");
                  form.reset();
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

