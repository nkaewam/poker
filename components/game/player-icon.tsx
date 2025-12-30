"use client";

import { IconPattern, generateIconPattern } from "@/lib/utils/icon-pattern";
import { cn } from "@/lib/utils";
import { JSX } from "react";

interface PlayerIconProps {
  playerId: string;
  size?: number;
  className?: string;
}

/**
 * Simple hash function to convert a string to a number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates a deterministic random number between 0 and max (exclusive)
 */
function seededRandom(seed: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

export type BorderShape =
  | "wavy"
  | "zigzag"
  | "scalloped"
  | "spiked"
  | "rounded"
  | "smooth";

/**
 * Generates border style properties based on playerId
 */
function generateBorderStyle(
  playerId: string,
  patternColors: string[],
  preferredBorderShape?: BorderShape,
  iconSize: number = 40
) {
  const hash = hashString(playerId);

  // Border width: 2px, 3px, or 4px (scaled proportionally to icon size)
  const widthSeed = seededRandom(hash + 100, 3);
  const baseBorderWidth = [2, 3, 4][widthSeed];
  const baseIconSize = 40;
  const borderWidth = (baseBorderWidth / baseIconSize) * iconSize;

  // Border shape: use preferred or generate from seed
  const borderShapes: BorderShape[] = [
    "wavy",
    "zigzag",
    "scalloped",
    "spiked",
    "rounded",
    "smooth",
  ];
  const borderShape =
    preferredBorderShape ||
    borderShapes[seededRandom(hash + 200, borderShapes.length)];

  // Border color: use one of the pattern colors
  const colorSeed = seededRandom(hash + 300, patternColors.length);
  const borderColor = patternColors[colorSeed];

  // Optional: add a subtle shadow/glow effect
  const hasGlow = seededRandom(hash + 400, 3) === 0; // 33% chance

  return {
    borderWidth,
    borderShape,
    borderColor,
    hasGlow,
  };
}

/**
 * Generates an SVG path for a decorative border shape around a circle
 * Returns both the clip path (for masking) and the border path (for stroke)
 */
function generateBorderPaths(
  shape: BorderShape,
  radius: number,
  borderWidth: number,
  seed: number,
  centerX: number,
  centerY: number
): { clipPath: string; borderPath: string } {
  const points: number = 64; // Number of points for smooth curves

  const clipPathParts: string[] = [];
  const borderPathParts: string[] = [];
  const amplitude = Math.min(borderWidth * 0.8, radius * 0.2); // Amplitude of the decorative pattern

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    let radiusOffset = 0;

    switch (shape) {
      case "wavy": {
        const waves = 4 + seededRandom(seed, 3); // 4-6 waves
        radiusOffset = Math.sin(angle * waves) * amplitude;
        break;
      }
      case "zigzag": {
        const zigzags = 8 + seededRandom(seed, 4); // 8-11 zigzags
        radiusOffset = (Math.sin(angle * zigzags) > 0 ? 1 : -1) * amplitude;
        break;
      }
      case "scalloped": {
        const scallops = 6 + seededRandom(seed, 3); // 6-8 scallops
        const scallopPhase = angle * scallops;
        radiusOffset = Math.max(0, Math.cos(scallopPhase)) * amplitude;
        break;
      }
      case "spiked": {
        const spikes = 8 + seededRandom(seed, 4); // 8-11 spikes
        const spikePhase = angle * spikes;
        radiusOffset = Math.max(0, Math.sin(spikePhase)) * amplitude * 1.5;
        break;
      }
      case "rounded": {
        const bumps = 6 + seededRandom(seed, 3); // 6-8 bumps
        radiusOffset = Math.max(0, Math.sin(angle * bumps)) * amplitude * 0.8;
        break;
      }
      case "smooth": {
        // Smooth circle, no variation
        radiusOffset = 0;
        break;
      }
    }

    // Clip path: simple circle (icon fills most of the space)
    const clipRadius = radius - borderWidth;
    const clipX = centerX + Math.cos(angle) * clipRadius;
    const clipY = centerY + Math.sin(angle) * clipRadius;

    // Border path: decorative shape at the border location
    const borderRadius = radius + radiusOffset;
    const borderX = centerX + Math.cos(angle) * borderRadius;
    const borderY = centerY + Math.sin(angle) * borderRadius;

    if (i === 0) {
      clipPathParts.push(`M ${clipX} ${clipY}`);
      borderPathParts.push(`M ${borderX} ${borderY}`);
    } else {
      clipPathParts.push(`L ${clipX} ${clipY}`);
      borderPathParts.push(`L ${borderX} ${borderY}`);
    }
  }

  clipPathParts.push("Z");
  borderPathParts.push("Z");

  return {
    clipPath: clipPathParts.join(" "),
    borderPath: borderPathParts.join(" "),
  };
}

interface PlayerIconOptions {
  patternType?: IconPattern["type"];
  borderShape?: BorderShape;
  seed?: string;
}

export function PlayerIcon({
  playerId,
  size = 40,
  className,
  patternType,
  borderShape,
  seed,
}: PlayerIconProps & PlayerIconOptions) {
  const iconSeed = seed || playerId;
  const basePattern = patternType
    ? { ...generateIconPattern(iconSeed), type: patternType }
    : generateIconPattern(iconSeed);
  const borderStyle = generateBorderStyle(
    iconSeed,
    basePattern.colors,
    borderShape,
    size
  );
  const hash = hashString(iconSeed);
  const radius = size / 2;

  // Scale pattern size proportionally to icon size
  // Base pattern size is 8-12, base icon size is 40
  // Scale pattern to maintain relative density
  const baseIconSize = 40;
  const scaledPatternSize = (basePattern.size / baseIconSize) * size;

  const pattern = {
    ...basePattern,
    size: scaledPatternSize,
  };

  // Calculate padding needed for decorative borders that extend outward
  // Max extension: borderWidth * 0.8 * 1.5 (for spiked) or radius * 0.2 * 1.5
  const maxExtension = Math.min(borderStyle.borderWidth * 1.2, radius * 0.3);
  const padding = Math.ceil(maxExtension + borderStyle.borderWidth);
  const viewBoxSize = size + padding * 2;
  const centerX = radius + padding;
  const centerY = radius + padding;

  const { clipPath, borderPath } = generateBorderPaths(
    borderStyle.borderShape,
    radius,
    borderStyle.borderWidth,
    hash,
    centerX,
    centerY
  );

  return (
    <div
      className={cn("shrink-0 rounded-full overflow-visible", className)}
      style={{
        width: size,
        height: size,
        filter: borderStyle.hasGlow
          ? `drop-shadow(0 0 ${borderStyle.borderWidth * 2}px ${
              borderStyle.borderColor
            }40)`
          : undefined,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        preserveAspectRatio="xMidYMid meet"
        className="size-auto"
        style={{
          width: `${size}px !important`,
          height: `${size}px !important`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        }}
      >
        <defs>
          <pattern
            id={`pattern-${playerId}`}
            x="0"
            y="0"
            width={pattern.size}
            height={pattern.size}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${pattern.rotation} ${pattern.size / 2} ${
              pattern.size / 2
            })`}
          >
            {renderPatternContent(pattern, pattern.size)}
          </pattern>
          {/* Clip path for decorative border shape */}
          <clipPath id={`clip-${playerId}`}>
            <path d={clipPath} />
          </clipPath>
        </defs>
        {/* Icon with decorative clip path applied */}
        <rect
          x={padding}
          y={padding}
          width={size}
          height={size}
          fill={`url(#pattern-${playerId})`}
          clipPath={`url(#clip-${playerId})`}
        />
        {/* Decorative border stroke */}
        <path
          d={borderPath}
          fill="none"
          stroke={borderStyle.borderColor}
          strokeWidth={borderStyle.borderWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function renderPatternContent(pattern: IconPattern, containerSize: number) {
  const { type, colors, size, density, variant } = pattern;

  switch (type) {
    case "grid":
      return renderGridPattern(colors, size, density, variant);
    case "dots":
      return renderDotsPattern(colors, size, density, variant);
    case "lines":
      return renderLinesPattern(colors, size, density, variant);
    case "shapes":
      return renderShapesPattern(colors, size, density, variant);
    default:
      return renderDotsPattern(colors, size, density, variant);
  }
}

function renderGridPattern(
  colors: string[],
  size: number,
  density: number,
  variant: number
) {
  const step = size / density;
  const elements: JSX.Element[] = [];

  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      const colorIndex = (i + j + variant) % colors.length;
      const shouldFill = (i + j + variant) % 2 === 0;

      if (shouldFill) {
        elements.push(
          <rect
            key={`${i}-${j}`}
            x={i * step}
            y={j * step}
            width={step}
            height={step}
            fill={colors[colorIndex]}
            opacity={0.8}
          />
        );
      }
    }
  }

  return <>{elements}</>;
}

function renderDotsPattern(
  colors: string[],
  size: number,
  density: number,
  variant: number
) {
  const step = size / density;
  const dotSize = step * 0.4;
  const elements: JSX.Element[] = [];

  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      const colorIndex = (i * density + j + variant) % colors.length;
      const shouldShow = (i + j + variant) % 2 === 0 || variant % 2 === 0;

      if (shouldShow) {
        elements.push(
          <circle
            key={`${i}-${j}`}
            cx={i * step + step / 2}
            cy={j * step + step / 2}
            r={dotSize / 2}
            fill={colors[colorIndex]}
            opacity={0.9}
          />
        );
      }
    }
  }

  return <>{elements}</>;
}

function renderLinesPattern(
  colors: string[],
  size: number,
  density: number,
  variant: number
) {
  const step = size / density;
  const lineWidth = step * 0.2;
  const elements: JSX.Element[] = [];

  const directions = [
    { x1: 0, y1: 0, x2: size, y2: size }, // Diagonal \
    { x1: size, y1: 0, x2: 0, y2: size }, // Diagonal /
    { x1: 0, y1: size / 2, x2: size, y2: size / 2 }, // Horizontal
    { x1: size / 2, y1: 0, x2: size / 2, y2: size }, // Vertical
  ];

  const direction = directions[variant % directions.length];
  const colorIndex = variant % colors.length;

  elements.push(
    <line
      key="main-line"
      x1={direction.x1}
      y1={direction.y1}
      x2={direction.x2}
      y2={direction.y2}
      stroke={colors[colorIndex]}
      strokeWidth={lineWidth}
      opacity={0.8}
    />
  );

  // Add additional lines for density
  for (let i = 1; i < density; i++) {
    const offset = i * step - size / 2;
    const parallelLine = {
      x1: direction.x1 + (direction.x2 === direction.x1 ? offset : 0),
      y1: direction.y1 + (direction.y2 === direction.y1 ? offset : 0),
      x2: direction.x2 + (direction.x2 === direction.x1 ? offset : 0),
      y2: direction.y2 + (direction.y2 === direction.y1 ? offset : 0),
    };

    elements.push(
      <line
        key={`line-${i}`}
        x1={parallelLine.x1}
        y1={parallelLine.y1}
        x2={parallelLine.x2}
        y2={parallelLine.y2}
        stroke={colors[(colorIndex + i) % colors.length]}
        strokeWidth={lineWidth * 0.6}
        opacity={0.6}
      />
    );
  }

  return <>{elements}</>;
}

function renderShapesPattern(
  colors: string[],
  size: number,
  density: number,
  variant: number
) {
  const step = size / density;
  const shapeSize = step * 0.6;
  const elements: JSX.Element[] = [];

  const shapes = ["circle", "square", "triangle"];
  const shapeType = shapes[variant % shapes.length];

  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      const colorIndex = (i + j + variant) % colors.length;
      const shouldShow = (i + j) % 2 === 0 || variant % 2 === 0;

      if (shouldShow) {
        const x = i * step + step / 2;
        const y = j * step + step / 2;

        if (shapeType === "circle") {
          elements.push(
            <circle
              key={`${i}-${j}`}
              cx={x}
              cy={y}
              r={shapeSize / 2}
              fill={colors[colorIndex]}
              opacity={0.8}
            />
          );
        } else if (shapeType === "square") {
          elements.push(
            <rect
              key={`${i}-${j}`}
              x={x - shapeSize / 2}
              y={y - shapeSize / 2}
              width={shapeSize}
              height={shapeSize}
              fill={colors[colorIndex]}
              opacity={0.8}
            />
          );
        } else if (shapeType === "triangle") {
          const points = [
            `${x},${y - shapeSize / 2}`,
            `${x - shapeSize / 2},${y + shapeSize / 2}`,
            `${x + shapeSize / 2},${y + shapeSize / 2}`,
          ].join(" ");
          elements.push(
            <polygon
              key={`${i}-${j}`}
              points={points}
              fill={colors[colorIndex]}
              opacity={0.8}
            />
          );
        }
      }
    }
  }

  return <>{elements}</>;
}
