"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { CreateGameHeader } from "@/components/create/create-game-header";
import { CreateGameForm } from "@/components/create/create-game-form";
import { useCreateGameForm } from "@/components/create/hooks/use-create-game-form";

export default function CreateGamePage() {
  const {
    form,
    handleSubmit,
    createGameMutation,
    shouldSkipNicknameInput,
    nicknameData,
  } = useCreateGameForm();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <AuthButton />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <CreateGameHeader shouldSkipNicknameInput={shouldSkipNicknameInput} />

          <CreateGameForm
            form={form}
            onSubmit={handleSubmit}
            isPending={createGameMutation.isPending}
            shouldSkipNicknameInput={shouldSkipNicknameInput}
            nickname={nicknameData?.nickname}
          />
        </div>
      </div>
    </div>
  );
}
