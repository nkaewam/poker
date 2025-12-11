/**
 * Generates a deterministic icon pattern from a seed value.
 * The pattern is always the same for the same seed.
 */

export interface IconPattern {
  type: "grid" | "dots" | "lines" | "shapes";
  colors: string[];
  size: number;
  density: number;
  rotation: number;
  variant: number;
}

const COLOR_PALETTES = [
  ["#3b82f6", "#60a5fa", "#93c5fd"], // Blue
  ["#10b981", "#34d399", "#6ee7b7"], // Green
  ["#f59e0b", "#fbbf24", "#fcd34d"], // Amber
  ["#ef4444", "#f87171", "#fca5a5"], // Red
  ["#8b5cf6", "#a78bfa", "#c4b5fd"], // Purple
  ["#ec4899", "#f472b6", "#f9a8d4"], // Pink
  ["#06b6d4", "#22d3ee", "#67e8f9"], // Cyan
  ["#14b8a6", "#5eead4", "#99f6e4"], // Teal
];

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

/**
 * Generates an icon pattern from a seed (typically player ID)
 */
export function generateIconPattern(seed: string): IconPattern {
  const hash = hashString(seed);

  // Select pattern type
  const typeIndex = seededRandom(hash, 4);
  const types: IconPattern["type"][] = ["grid", "dots", "lines", "shapes"];
  const type = types[typeIndex];

  // Select color palette
  const colorIndex = seededRandom(hash + 1, COLOR_PALETTES.length);
  const colors = COLOR_PALETTES[colorIndex];

  // Generate other properties
  const size = 8 + seededRandom(hash + 2, 5); // 8-12
  const density = 3 + seededRandom(hash + 3, 3); // 3-5
  const rotation = seededRandom(hash + 4, 360);
  const variant = seededRandom(hash + 5, 4); // 0-3 variants per type

  return {
    type,
    colors,
    size,
    density,
    rotation,
    variant,
  };
}
