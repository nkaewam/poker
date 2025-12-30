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

interface BuyInAmountFieldProps {
  form: UseFormReturn<CreateGameFormValues>;
}

export function BuyInAmountField({ form }: BuyInAmountFieldProps) {
  return (
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
                field.onChange(value === "" ? NaN : parseFloat(value));
              }}
              value={isNaN(field.value) ? "" : field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
