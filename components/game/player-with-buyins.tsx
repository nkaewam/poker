"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, parseCurrency } from "@/lib/format";
import { PlayerIcon } from "@/components/game/player-icon";
import { UserIcon } from "@/components/auth/user-icon";
import { isGuestPlayer } from "@/lib/utils/player-utils";
import { useSession } from "@/lib/api/hooks";
import { useAuth } from "@/components/auth/use-auth";
import type { GameState } from "@/lib/storage";
import { TrashIcon } from "lucide-react";

interface PlayerWithBuyInsProps {
  player: { id: string; name: string; sessionId: string | null };
  buyIns: number[];
  total: number;
  gameState: GameState;
  buyInAmount: number | null;
  onUpdateName: (name: string) => void;
  onAddBuyIn: (amount: number) => void;
  onRemoveBuyIn: (index: number) => void;
  isUpdatingName?: boolean;
  loadingBuyIn: { playerId: string; amount: number } | null;
  removingBuyIn: { playerId: string; index: number } | null;
}

export function PlayerWithBuyIns({
  player,
  buyIns,
  total,
  gameState,
  buyInAmount,
  onUpdateName,
  onAddBuyIn,
  onRemoveBuyIn,
  isUpdatingName = false,
  loadingBuyIn,
  removingBuyIn,
}: PlayerWithBuyInsProps) {
  const { data: session } = useSession();
  const { user } = useAuth();
  const isGuest = isGuestPlayer(player.id, gameState);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(player.name);
  const [customAmount, setCustomAmount] = useState("");

  // Check if this player belongs to the current authenticated user
  // Use UserIcon if the player's session matches the current session AND user is authenticated
  const isCurrentUser = user && player.sessionId === session?.id;

  // Check if the current user can edit this player's name (only for guest players created by the current user, not authenticated players)
  const canEditName = isGuest && player.sessionId === session?.id;

  useEffect(() => {
    setName(player.name);
  }, [player.name]);

  const handleSaveName = () => {
    if (name.trim()) {
      onUpdateName(name);
      setIsEditingName(false);
    }
  };

  const handleCancelName = () => {
    setName(player.name);
    setIsEditingName(false);
  };

  const handleCustomAdd = () => {
    const amount = parseCurrency(customAmount);
    if (amount > 0) {
      onAddBuyIn(amount);
      setCustomAmount("");
    }
  };

  // Determine preset amounts: use buyInAmount if set, otherwise fallback to defaults
  const presetAmounts = buyInAmount ? [buyInAmount] : [100, 200, 300];

  // Check if this specific player's buy-in is loading
  const isThisPlayerLoading = loadingBuyIn?.playerId === player.id;
  const isThisPlayerRemoving = removingBuyIn?.playerId === player.id;
  const isLoading = isThisPlayerLoading || isThisPlayerRemoving;

  // Helper to check if a specific amount button is loading
  const isAmountLoading = (amount: number) =>
    isThisPlayerLoading && loadingBuyIn?.amount === amount;

  // Check if custom amount button should show spinner
  // (if loading amount is not one of the preset amounts)
  const isCustomAmountLoading =
    isThisPlayerLoading &&
    loadingBuyIn &&
    !presetAmounts.includes(loadingBuyIn.amount);

  // Helper to check if a specific remove button is loading
  const isRemoveButtonLoading = (index: number) =>
    isThisPlayerRemoving && removingBuyIn?.index === index;

  return (
    <div className="rounded-md border bg-card p-4 space-y-4">
      {/* Player Name Section */}
      <div className="flex items-center gap-2 pb-3 border-b">
        {isEditingName ? (
          <>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
              disabled={isUpdatingName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") handleCancelName();
              }}
              autoFocus
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveName}
              disabled={isUpdatingName}
            >
              {isUpdatingName && <Spinner className="mr-2" />}
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelName}
              disabled={isUpdatingName}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            {isCurrentUser && user ? (
              <UserIcon userId={user.id} size={40} />
            ) : (
              <PlayerIcon playerId={player.id} size={40} />
            )}
            <span className="font-semibold text-lg">{player.name}</span>
            {isGuest && (
              <Badge
                variant="outline"
                className="rounded-md text-muted-foreground bg-muted/20 border-muted-foreground/20"
              >
                guest
              </Badge>
            )}
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground">
              Total: {formatCurrency(total)}
            </span>
            {canEditName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(true)}
                disabled={isUpdatingName}
              >
                Edit
              </Button>
            )}
          </>
        )}
      </div>

      {/* Buy-in Section */}
      <div className="flex sm:flex-row flex-col gap-2 items-center">
        <p className="text-sm font-semibold text-muted-foreground text-nowrap w-full sm:w-auto">
          Buy-ins
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap w-full">
          <div className="w-full sm:w-auto">
            <ButtonGroup className="w-full sm:w-auto">
              {presetAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => onAddBuyIn(amount)}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isAmountLoading(amount) && <Spinner className="mr-2" />}+
                  {formatCurrency(amount)}
                </Button>
              ))}
            </ButtonGroup>
          </div>
          <div className="w-full sm:flex-1 sm:min-w-[200px]">
            <ButtonGroup className="w-full">
              <Input
                type="number"
                placeholder="Custom amount: ฿"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                disabled={isThisPlayerLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isThisPlayerLoading)
                    handleCustomAdd();
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCustomAdd}
                disabled={isLoading}
              >
                {isCustomAmountLoading && <Spinner className="mr-2" />}
                Add
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
      {buyIns.length > 0 && (
        <div className="space-y-1 border pl-4 pr-2 py-2 rounded-md bg-muted">
          {buyIns.map((amount, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">
                Buy-in #{index + 1}: {formatCurrency(amount)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveBuyIn(index)}
                disabled={isThisPlayerRemoving}
              >
                {isRemoveButtonLoading(index) ? (
                  <Spinner className="size-4 text-muted-foreground" />
                ) : (
                  <TrashIcon className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
