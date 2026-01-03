import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { JoinFormValues } from "./join-game-schema";

interface PlayerNameFieldProps {
  form: UseFormReturn<JoinFormValues>;
  shouldSkipNicknameInput: boolean;
  nickname?: string;
}

export function PlayerNameField({
  form,
  shouldSkipNicknameInput,
  nickname,
}: PlayerNameFieldProps) {
  if (shouldSkipNicknameInput) {
    return (
      <FormField
        control={form.control}
        name="playerName"
        render={({ field }) => (
          <input
            type="hidden"
            {...field}
            value={nickname || ""}
          />
        )}
      />
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
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
