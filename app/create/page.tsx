"use client";

import { CreateGameForm } from "@/components/create/create-game-form";
import { useCreateGameForm } from "@/components/create/hooks/use-create-game-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreateGamePage() {
  const {
    form,
    handleSubmit,
    createGameMutation,
    shouldSkipNicknameInput,
    nicknameData,
  } = useCreateGameForm();

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Game</CardTitle>
          <CardDescription>
            {shouldSkipNicknameInput
              ? "Ready to create your game"
              : "Enter your name to start"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGameForm
            form={form}
            onSubmit={handleSubmit}
            isPending={createGameMutation.isPending}
            shouldSkipNicknameInput={shouldSkipNicknameInput}
            nickname={nicknameData?.nickname}
          />
        </CardContent>
      </Card>
    </div>
  );
}
