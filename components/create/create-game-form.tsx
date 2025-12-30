import Link from "next/link";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PlayerNameField } from "./player-name-field";
import { BuyInAmountField } from "./buy-in-amount-field";
import { SettlementModeField } from "./settlement-mode-field";
import type { UseFormReturn } from "react-hook-form";
import type { CreateGameFormValues } from "./hooks/use-create-game-form";

interface CreateGameFormProps {
  form: UseFormReturn<CreateGameFormValues>;
  onSubmit: (data?: CreateGameFormValues) => Promise<void>;
  isPending: boolean;
  shouldSkipNicknameInput: boolean;
  nickname?: string | null;
}

export function CreateGameForm({
  form,
  onSubmit,
  isPending,
  shouldSkipNicknameInput,
  nickname,
}: CreateGameFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <PlayerNameField
          form={form}
          shouldSkipNicknameInput={shouldSkipNicknameInput}
          nickname={nickname}
        />

        <BuyInAmountField form={form} />

        <SettlementModeField form={form} />

        <Button
          type="submit"
          className={`w-full ${shouldSkipNicknameInput ? "text-white" : ""}`}
          size="lg"
          disabled={isPending}
        >
          {isPending && <Spinner className="mr-2" />}
          {isPending ? "Creating..." : "Create Game"}
        </Button>

        <Button type="button" asChild variant="ghost" className="w-full">
          <Link href="/">Back</Link>
        </Button>
      </form>
    </Form>
  );
}
