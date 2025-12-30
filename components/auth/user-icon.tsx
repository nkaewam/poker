"use client";

import { PlayerIcon } from "@/components/game/player-icon";
import { useUserIconPreferences } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import type { IconPattern } from "@/lib/utils/icon-pattern";
import type { BorderShape } from "@/components/game/player-icon";

interface UserIconProps {
  userId: string;
  size?: number;
  className?: string;
  previewPatternType?: IconPattern["type"];
  previewBorderShape?: BorderShape;
  previewIconSeed?: string;
  previewIconColor?: string;
}

export function UserIcon({
  userId,
  size = 40,
  className,
  previewPatternType,
  previewBorderShape,
  previewIconSeed,
  previewIconColor,
}: UserIconProps) {
  const { data: iconPreferences, dataUpdatedAt } = useUserIconPreferences();

  // Use preview props if provided (for dialog preview), otherwise use saved preferences
  const patternType =
    previewPatternType !== undefined
      ? previewPatternType
      : iconPreferences?.patternType
      ? (iconPreferences.patternType as IconPattern["type"])
      : undefined;

  const borderShape =
    previewBorderShape !== undefined
      ? previewBorderShape
      : iconPreferences?.borderShape
      ? (iconPreferences.borderShape as BorderShape)
      : undefined;

  // Handle iconSeed: use preview if provided, otherwise use saved preference (null/empty means use userId)
  const iconSeed =
    previewIconSeed !== undefined
      ? previewIconSeed || userId
      : iconPreferences?.iconSeed && iconPreferences.iconSeed.trim() !== ""
      ? iconPreferences.iconSeed
      : userId;

  // Handle iconColor: use preview if provided, otherwise use saved preference
  const iconColor =
    previewIconColor !== undefined
      ? previewIconColor
      : iconPreferences?.iconColor || undefined;

  // Create a key based on icon preferences - this will change when preferences change
  // Using a stable string format ensures React recognizes the change and remounts
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
