"use client";

import { cn } from "@/lib/utils";

// Pre-defined color palette (6 colors)
const COLOR_PALETTE = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber/Orange
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-6 gap-2 px-2 py-4 bg-muted rounded-md border border-border items-center justify-items-center",
        className
      )}
    >
      {COLOR_PALETTE.map((color) => {
        const isSelected = value === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "relative size-8 rounded-full border-2 transition-all",
              "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              isSelected
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-transparent hover:border-primary/50"
            )}
            style={{
              backgroundColor: color,
              boxShadow: isSelected
                ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${color}40, 0 0 12px ${color}60`
                : undefined,
            }}
            aria-label={`Select color ${color}`}
          >
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: color === "#ffffff" ? "#000" : "#fff",
                  }}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
