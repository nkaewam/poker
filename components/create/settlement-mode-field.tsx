import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import type { UseFormReturn } from "react-hook-form";
import type { CreateGameFormValues } from "./hooks/use-create-game-form";

interface SettlementModeFieldProps {
  form: UseFormReturn<CreateGameFormValues>;
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function SettlementModeField({ form }: SettlementModeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="settlementMode"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="mb-2">Settlement Mode</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-col"
            >
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem
                  value="PEER_TO_PEER"
                  id="peer-to-peer"
                  className="border-2 border-foreground/40 bg-background"
                />
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="peer-to-peer"
                    className="font-normal cursor-pointer"
                  >
                    Peer-to-Peer
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.preventDefault()}
                      >
                        <InfoIcon />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Calculates the minimal number of transfers needed.
                        Players transfer directly to each other based on their
                        net results.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem
                  value="COLLECTOR"
                  id="collector"
                  className="border-2 border-foreground/40 bg-background"
                />
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="collector"
                    className="font-normal cursor-pointer"
                  >
                    Collector
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.preventDefault()}
                      >
                        <InfoIcon />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        One person collects all buy-ins and handles all payouts
                        after the game finishes. All players pay the collector,
                        and the collector pays winners.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
