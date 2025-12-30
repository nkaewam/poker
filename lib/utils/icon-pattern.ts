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
 * Converts hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

/**
 * Converts RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Lightens a color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 + percent / 100;
  return rgbToHex(
    Math.min(255, Math.round(r * factor)),
    Math.min(255, Math.round(g * factor)),
    Math.min(255, Math.round(b * factor))
  );
}

/**
 * Darkens a color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - percent / 100;
  return rgbToHex(
    Math.max(0, Math.round(r * factor)),
    Math.max(0, Math.round(g * factor)),
    Math.max(0, Math.round(b * factor))
  );
}

/**
 * Generates an icon pattern from a seed (typically player ID)
 * If preferredColor is provided, it will be used as the primary color
 */
export function generateIconPattern(
  seed: string,
  preferredColor?: string
): IconPattern {
  const hash = hashString(seed);

  // Select pattern type
  const typeIndex = seededRandom(hash, 4);
  const types: IconPattern["type"][] = ["grid", "dots", "lines", "shapes"];
  const type = types[typeIndex];

  // Select color palette or use preferred color
  let colors: string[];
  if (preferredColor) {
    // Generate variations of the preferred color (lighter and darker shades)
    const baseColor = preferredColor;
    const lighter = lightenColor(baseColor, 30);
    const darker = darkenColor(baseColor, 20);
    colors = [baseColor, lighter, darker];
  } else {
    const colorIndex = seededRandom(hash + 1, COLOR_PALETTES.length);
    colors = COLOR_PALETTES[colorIndex];
  }

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
