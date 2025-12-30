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
}

export function UserIcon({
  userId,
  size = 40,
  className,
  previewPatternType,
  previewBorderShape,
  previewIconSeed,
}: UserIconProps) {
  const { data: iconPreferences } = useUserIconPreferences();

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

  const iconSeed = previewIconSeed || iconPreferences?.iconSeed || userId;

  return (
    <PlayerIcon
      playerId={iconSeed}
      size={size}
      className={cn("flex items-center justify-center", className)}
      patternType={patternType}
      borderShape={borderShape}
      seed={iconSeed}
    />
  );
}
