"use client";

import { useGameLogs } from "@/lib/api/hooks";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { GameLogResponse } from "@/lib/api/schemas";
import { PlayerIconWithSession } from "@/components/game/player-icon-with-session";

interface GameLogTabProps {
  gameCode: string;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    game_created: "Game Created",
    player_added: "Player Added",
    player_name_updated: "Player Name Updated",
    buyin_added: "Buy-in Added",
    buyin_removed: "Buy-in Removed",
    final_updated: "Final Updated",
    settlement_mode_updated: "Settlement Mode Updated",
  };
  return labels[action] || action;
}

function getActionBadgeVariant(
  action: string
): "default" | "secondary" | "outline" {
  if (action === "game_created") return "default";
  if (action === "player_added" || action === "buyin_added") return "secondary";
  if (
    action === "buyin_removed" ||
    action === "player_name_updated" ||
    action === "final_updated" ||
    action === "settlement_mode_updated"
  )
    return "outline";
  return "outline";
}

function formatLogMessage(log: GameLogResponse): string {
  const {
    action,
    playerName,
    actorPlayerName,
    actorSessionId,
    playerSessionId,
    metadata,
  } = log;
  const actorName = actorPlayerName || "Someone";
  const targetName = playerName || "unknown player";
  // Check if actor and target are the same by comparing session IDs
  const isSelfAction =
    actorSessionId !== null &&
    playerSessionId !== null &&
    actorSessionId === playerSessionId;

  switch (action) {
    case "game_created":
      return `${actorName} created game with code ${
        (metadata as { gameCode?: string })?.gameCode || "unknown"
      }`;

    case "player_added":
      // If actor is the same as the player being added, it's a self-join
      if (isSelfAction) {
        return `${actorName} joined the game`;
      }
      return `${actorName} added ${targetName} to the game`;

    case "player_name_updated":
      const nameMeta = metadata as { oldName?: string; newName?: string };
      // If actor is the same as the player being updated, it's a self-update
      if (isSelfAction) {
        return `${actorName} changed name from ${
          nameMeta.oldName || "Unknown"
        } to ${nameMeta.newName || "Unknown"}`;
      }
      return `${actorName} updated ${targetName}'s name from ${
        nameMeta.oldName || "Unknown"
      } to ${nameMeta.newName || "Unknown"}`;

    case "buyin_added":
      const buyInAmount = (metadata as { amount?: number })?.amount;
      // If actor is the same as the target player, it's a self-add
      if (isSelfAction) {
        return `${actorName} added ${
          buyInAmount ? formatCurrency(buyInAmount) : "buy-in"
        }`;
      }
      return `${actorName} added ${
        buyInAmount ? formatCurrency(buyInAmount) : "buy-in"
      } for ${targetName}`;

    case "buyin_removed":
      const removedAmount = (metadata as { amount?: number })?.amount;
      // If actor is the same as the target player, it's a self-remove
      if (isSelfAction) {
        return `${actorName} removed ${
          removedAmount ? formatCurrency(removedAmount) : "buy-in"
        }`;
      }
      return `${actorName} removed ${
        removedAmount ? formatCurrency(removedAmount) : "buy-in"
      } from ${targetName}`;

    case "final_updated":
      const finalMeta = metadata as {
        oldAmount?: number | null;
        newAmount?: number;
      };
      // If actor is the same as the target player, it's a self-update
      if (isSelfAction) {
        if (finalMeta.oldAmount === null || finalMeta.oldAmount === undefined) {
          return `${actorName} set final to ${
            finalMeta.newAmount ? formatCurrency(finalMeta.newAmount) : "0"
          }`;
        }
        return `${actorName} updated final: ${formatCurrency(
          finalMeta.oldAmount
        )} → ${
          finalMeta.newAmount ? formatCurrency(finalMeta.newAmount) : "0"
        }`;
      }
      if (finalMeta.oldAmount === null || finalMeta.oldAmount === undefined) {
        return `${actorName} set final to ${
          finalMeta.newAmount ? formatCurrency(finalMeta.newAmount) : "0"
        } for ${targetName}`;
      }
      return `${actorName} updated final for ${targetName}: ${formatCurrency(
        finalMeta.oldAmount
      )} → ${finalMeta.newAmount ? formatCurrency(finalMeta.newAmount) : "0"}`;

    case "settlement_mode_updated":
      const settlementMeta = metadata as {
        settlementMode?: "COLLECTOR" | "PEER_TO_PEER";
        collectorPlayerName?: string | null;
      };
      const mode = settlementMeta.settlementMode || "Unknown";
      if (mode === "COLLECTOR" && settlementMeta.collectorPlayerName) {
        return `${actorName} changed settlement mode to Collector (${settlementMeta.collectorPlayerName})`;
      }
      if (mode === "PEER_TO_PEER") {
        return `${actorName} changed settlement mode to Peer-to-Peer`;
      }
      return `${actorName} changed settlement mode to ${mode}`;

    default:
      return "Unknown action";
  }
}

export function GameLogTab({ gameCode }: GameLogTabProps) {
  const { data: logs, isLoading, error } = useGameLogs(gameCode);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="mr-2" />
        <span className="text-sm text-muted-foreground">Loading logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">
          Failed to load logs. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-muted-foreground mt-2">
            {error instanceof Error ? error.message : String(error)}
          </p>
        )}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No logs yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold mb-3">Game Log</h2>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-md border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getActionBadgeVariant(log.action)}>
                  {getActionLabel(log.action)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTimestamp(log.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Actor avatar */}
              {log.actorPlayerId && (
                <PlayerIconWithSession
                  playerId={log.actorPlayerId}
                  sessionId={log.actorSessionId}
                  size={24}
                  className="shrink-0"
                />
              )}
              <p className="text-sm flex-1">{formatLogMessage(log)}</p>
              {/* Target player avatar (if different from actor) */}
              {log.playerId && log.actorPlayerId !== log.playerId && (
                <PlayerIconWithSession
                  playerId={log.playerId}
                  sessionId={log.playerSessionId}
                  size={24}
                  className="shrink-0"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
