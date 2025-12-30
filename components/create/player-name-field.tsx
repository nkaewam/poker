import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { CreateGameFormValues } from "./hooks/use-create-game-form";

interface PlayerNameFieldProps {
  form: UseFormReturn<CreateGameFormValues>;
  shouldSkipNicknameInput: boolean;
  nickname?: string | null;
}

export function PlayerNameField({
  form,
  shouldSkipNicknameInput,
  nickname,
}: PlayerNameFieldProps) {
  if (shouldSkipNicknameInput) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Playing as: <span className="font-semibold">{nickname}</span>
        </p>
      </div>
    );
  }

  return (
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
  );
}
