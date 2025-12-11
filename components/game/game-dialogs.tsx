"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GameDialogsProps {
  gameCode?: string;
  joinUrl: string;
  isQrCodeOpen: boolean;
  onQrCodeOpenChange: (open: boolean) => void;
  isLeaveDialogOpen: boolean;
  onLeaveDialogOpenChange: (open: boolean) => void;
  onLeaveGame: () => void;
}

export function GameDialogs({
  gameCode,
  joinUrl,
  isQrCodeOpen,
  onQrCodeOpenChange,
  isLeaveDialogOpen,
  onLeaveDialogOpenChange,
  onLeaveGame,
}: GameDialogsProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleLeaveGame = () => {
    onLeaveDialogOpenChange(false);
    onLeaveGame();
  };

  const handleCopyGameCode = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode);
      setIsCopied(true);
      toast.success("Game code copied to clipboard");
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isQrCodeOpen) {
      setIsCopied(false);
    }
  }, [isQrCodeOpen]);

  return (
    <>
      {/* QR Code Modal */}
      {gameCode && (
        <Dialog open={isQrCodeOpen} onOpenChange={onQrCodeOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan to Join Game</DialogTitle>
              <DialogDescription>
                Share this QR code so others can join the game
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              {joinUrl && (
                <div className="rounded-lg border-2 border-foreground/20 p-4 bg-white">
                  <QRCodeSVG
                    value={joinUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              )}
              <div className="text-center space-y-2 w-full">
                <p className="text-sm text-muted-foreground">Game Code</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-2xl font-mono font-bold">
                    {gameCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyGameCode}
                    className="h-9 w-9 p-0"
                    aria-label="Copy game code"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Leave Game Confirmation Dialog */}
      {gameCode && (
        <Dialog open={isLeaveDialogOpen} onOpenChange={onLeaveDialogOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Leave Game?</DialogTitle>
              <DialogDescription>
                Are you sure you want to leave this game? You can rejoin later
                using the game code.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-md border bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Game Code</p>
                <code className="text-2xl font-mono font-bold">{gameCode}</code>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Save this code to rejoin the game later.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onLeaveDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLeaveGame}>
                Leave Game
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
