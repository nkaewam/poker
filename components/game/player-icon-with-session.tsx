"use client";

import { PlayerIcon } from "@/components/game/player-icon";
import { useUserIconPreferences, useUserIconPreferencesBySession, useSession } from "@/lib/api/hooks";
import { useAuth } from "@/components/auth/use-auth";
import { cn } from "@/lib/utils";
import type { IconPattern } from "@/lib/utils/icon-pattern";
import type { BorderShape } from "@/components/game/player-icon";

interface PlayerIconWithSessionProps {
  playerId: string;
  sessionId: string | null;
  size?: number;
  className?: string;
}

/**
 * PlayerIcon component that respects user icon preferences.
 * If the player belongs to the current authenticated user, uses the current user's icon preferences.
 * Otherwise, falls back to default PlayerIcon behavior (deterministic based on playerId).
 */
export function PlayerIconWithSession({
  playerId,
  sessionId,
  size = 40,
  className,
}: PlayerIconWithSessionProps) {
  const { data: currentSession } = useSession();
  const { user } = useAuth();
  
  // Check if this player belongs to the current authenticated user
  const isCurrentUser =
    user && sessionId === currentSession?.id;

  // Use current user's preferences if this player belongs to them, otherwise use player's session preferences
  const { data: iconPreferences, dataUpdatedAt } = isCurrentUser
    ? useUserIconPreferences()
    : useUserIconPreferencesBySession(sessionId);

  // Use user preferences if available, otherwise use defaults
  const patternType = iconPreferences?.patternType
    ? (iconPreferences.patternType as IconPattern["type"])
    : undefined;

  const borderShape = iconPreferences?.borderShape
    ? (iconPreferences.borderShape as BorderShape)
    : undefined;

  // Handle iconSeed: use user preference if available, otherwise use playerId
  const iconSeed =
    iconPreferences?.iconSeed && iconPreferences.iconSeed.trim() !== ""
      ? iconPreferences.iconSeed
      : playerId;

  const iconColor = iconPreferences?.iconColor || undefined;

  // Create a key based on icon preferences - this will change when preferences change
  const iconKey = `${iconSeed}-${patternType || "auto"}-${
    borderShape || "auto"
  }-${iconColor || "auto"}`;

  // Use a separate remount key that includes dataUpdatedAt to force remount when query updates
  const remountKey = `${iconKey}-${dataUpdatedAt || 0}`;

  return (
    <PlayerIcon
      key={remountKey}
      playerId={iconSeed}
      size={size}
      className={cn("flex items-center justify-center", className)}
      patternType={patternType}
      borderShape={borderShape}
      seed={iconSeed}
      preferredColor={iconColor}
    />
  );
}
