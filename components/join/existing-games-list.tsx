import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

interface Game {
  id: string;
  gameCode: string;
  buyInAmount: string | null;
  createdAt: Date | string;
}

interface ExistingGamesListProps {
  games: Game[];
  onSelectGame: (gameCode: string) => void;
}

export function ExistingGamesList({
  games,
  onSelectGame,
}: ExistingGamesListProps) {
  return (
    <div className="flex flex-col gap-2">
      {games.map((game) => (
        <Button
          variant="outline"
          key={game.id}
          className="items-start flex-col h-auto gap-1"
          onClick={() => onSelectGame(game.gameCode)}
        >
          <p className="font-bold">{game.gameCode}</p>
          <div className="flex items-center justify-between w-full">
            {game.buyInAmount && (
              <p className="text-sm text-muted-foreground">
                Buy-ins: {formatCurrency(+game.buyInAmount)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Created {formatRelativeTime(game.createdAt.toString())}
            </p>
          </div>
        </Button>
      ))}
    </div>
  );
}
