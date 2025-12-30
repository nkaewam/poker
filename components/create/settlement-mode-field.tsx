import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { UseFormReturn } from "react-hook-form";
import type { CreateGameFormValues } from "./hooks/use-create-game-form";
import { Badge } from "../ui/badge";

interface SettlementModeFieldProps {
  form: UseFormReturn<CreateGameFormValues>;
}

export function SettlementModeField({ form }: SettlementModeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="settlementMode"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="mb-5">Settlement Mode</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-col gap-6"
            >
              <Label
                htmlFor="peer-to-peer"
                className="flex items-start space-x-3 space-y-0 cursor-pointer rounded-lg p-3 -m-3 hover:bg-accent/20 transition-colors"
              >
                <RadioGroupItem
                  value="PEER_TO_PEER"
                  id="peer-to-peer"
                  className="border-2 border-foreground/40 bg-background mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <span className="font-normal">Peer-to-Peer</span>
                  <p className="text-xs  text-muted-foreground font-normal">
                    Calculates the minimal number of transfers needed. Players
                    transfer directly to each other based on their net results.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="collector"
                className="flex items-start space-x-3 space-y-0 cursor-pointer rounded-lg p-3 -m-3 hover:bg-accent/20 transition-colors"
              >
                <RadioGroupItem
                  value="COLLECTOR"
                  id="collector"
                  className="border-2 border-foreground/40 bg-background mt-0.5"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="font-normal">Collector</span>
                    <Badge className="text-xs px-1.5 py-0.5">New</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-normal">
                    One person collects all buy-ins and handles all payouts
                    after the game finishes. All players pay the collector, and
                    the collector pays final balances.
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
