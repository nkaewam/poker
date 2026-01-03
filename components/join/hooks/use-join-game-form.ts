import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { UseFormReturn } from "react-hook-form";
import { JoinFormValues } from "../join-game-schema";

interface UseJoinGameFormProps {
  form: UseFormReturn<JoinFormValues>;
  gameCodeParam: string | null;
  nickname?: string;
  lastPlayerName?: string;
  shouldSkipNicknameInput: boolean;
}

export function useJoinGameForm({
  form,
  gameCodeParam,
  nickname,
  lastPlayerName,
  shouldSkipNicknameInput,
}: UseJoinGameFormProps) {
  const hasInitialized = useRef(false);

  // Initialize form values from async data (use reset to avoid marking form as dirty)
  useEffect(() => {
    // Skip if already initialized or form has been touched by user
    if (hasInitialized.current || form.formState.isDirty) {
      return;
    }

    let gameCode = form.getValues("gameCode");
    let playerName = form.getValues("playerName");

    // Update game code from query param if needed
    if (gameCodeParam) {
      const upperCode = gameCodeParam.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (upperCode.length <= 5) {
        gameCode = upperCode;
      }
    }

    // Update player name: prioritize nickname, then last player name
    if (shouldSkipNicknameInput && nickname) {
      playerName = nickname;
    } else if (!playerName) {
      // Only prefill if playerName is empty (user hasn't typed)
      if (nickname) {
        playerName = nickname;
      } else if (lastPlayerName) {
        playerName = lastPlayerName;
      }
    }

    // Reset form with all values at once to avoid marking as dirty
    if (
      gameCode !== form.getValues("gameCode") ||
      playerName !== form.getValues("playerName")
    ) {
      form.reset({
        gameCode,
        playerName,
      });
      hasInitialized.current = true;
    }
  }, [
    gameCodeParam,
    nickname,
    lastPlayerName,
    form,
    shouldSkipNicknameInput,
  ]);

  // Handle updates after initialization (use setValue for user-initiated changes)
  useEffect(() => {
    // If authenticated with nickname, always use nickname (even if user typed something)
    if (
      shouldSkipNicknameInput &&
      nickname &&
      hasInitialized.current
    ) {
      const currentName = form.getValues("playerName");
      if (currentName !== nickname) {
        form.setValue("playerName", nickname);
      }
    }
  }, [nickname, form, shouldSkipNicknameInput]);
}
