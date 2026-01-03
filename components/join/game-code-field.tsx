import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { UseFormReturn } from "react-hook-form";
import { JoinFormValues } from "./join-game-schema";

interface GameCodeFieldProps {
  form: UseFormReturn<JoinFormValues>;
}

export function GameCodeField({ form }: GameCodeFieldProps) {
  return (
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
                const filtered = value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "");
                field.onChange(filtered);
              }}
              pattern="[A-Z0-9]*"
              inputMode="text"
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
  );
}
