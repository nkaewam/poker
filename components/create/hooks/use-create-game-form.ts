import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  useCreateGame,
  useLastPlayerName,
  useUserNickname,
} from "@/lib/api/hooks";
import { useAuth } from "@/components/auth/use-auth";

export const createGameSchema = z.object({
  playerName: z
    .string()
    .max(50, "Name must be less than 50 characters")
    .optional(),
  buyInAmount: z
    .number({
      message: "Buy-in amount is required",
    })
    .refine((val) => !isNaN(val), {
      message: "Buy-in amount is required",
    })
    .positive("Buy-in amount must be positive"),
  settlementMode: z.enum(["COLLECTOR", "PEER_TO_PEER"]).optional(),
});

export type CreateGameFormValues = z.infer<typeof createGameSchema>;

export function useCreateGameForm() {
  const router = useRouter();
  const createGameMutation = useCreateGame();
  const { data: lastPlayerNameData } = useLastPlayerName();
  const { data: nicknameData } = useUserNickname();
  const { isAuthenticated } = useAuth();
  const hasNickname = !!nicknameData?.nickname;
  const shouldSkipNicknameInput = isAuthenticated && hasNickname;

  const form = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      playerName: "",
      buyInAmount: undefined,
      settlementMode: "PEER_TO_PEER",
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
      // buyInAmount is required, so it must be present in data
      if (!data?.buyInAmount) {
        return; // Form validation should prevent this, but add safety check
      }

      // Validate playerName if not authenticated
      if (!shouldSkipNicknameInput) {
        const playerNameValue = data.playerName?.trim() ?? "";
        if (playerNameValue.length === 0) {
          form.setError("playerName", {
            type: "manual",
            message: "Name is required",
          });
          return;
        }
        if (playerNameValue.length > 50) {
          form.setError("playerName", {
            type: "manual",
            message: "Name must be less than 50 characters",
          });
          return;
        }
      }

      // If authenticated with nickname, use nickname; otherwise use form data
      const playerName = shouldSkipNicknameInput
        ? nicknameData!.nickname!
        : data.playerName?.trim() ?? "";

      const game = await createGameMutation.mutateAsync({
        playerName,
        buyInAmount: data.buyInAmount,
        settlementMode: data.settlementMode || "PEER_TO_PEER",
        // If collector mode, set collector to the creator (will be set after player creation)
        collectorPlayerId:
          data.settlementMode === "COLLECTOR" ? undefined : undefined,
      });
      router.push(`/g/${game.gameCode}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      // Error will be shown via form validation or we could add a toast
    }
  };

  return {
    form,
    handleSubmit,
    createGameMutation,
    shouldSkipNicknameInput,
    nicknameData,
  };
}
