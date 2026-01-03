import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ExistingGamesList } from "./existing-games-list";

interface Game {
  id: string;
  gameCode: string;
  buyInAmount: string | null;
  createdAt: Date | string;
}

interface ExistingGamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  games: Game[];
  onSelectGame: (gameCode: string) => void;
  isDesktop: boolean;
}

export function ExistingGamesDialog({
  open,
  onOpenChange,
  games,
  onSelectGame,
  isDesktop,
}: ExistingGamesDialogProps) {
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent position="br" className="p-4" size="sm">
          <DialogTitle>Join existing game</DialogTitle>
          <ExistingGamesList games={games} onSelectGame={onSelectGame} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Join existing game</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <ExistingGamesList games={games} onSelectGame={onSelectGame} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
