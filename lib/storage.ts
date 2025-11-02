export interface GameState {
  players: Array<{ id: string; name: string }>;
  buyIns: Record<string, number[]>;
  finals: Record<string, number | null>;
}

const STORAGE_KEY = "poker:currentGame";

/**
 * Loads game state from localStorage
 */
export function loadGameState(): GameState | null {
  if (typeof window === "undefined") {
    return null;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate structure
    if (
      !parsed ||
      !Array.isArray(parsed.players) ||
      typeof parsed.buyIns !== "object" ||
      typeof parsed.finals !== "object"
    ) {
      return null;
    }
    
    return parsed as GameState;
  } catch {
    return null;
  }
}

/**
 * Saves game state to localStorage
 */
export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
}

/**
 * Clears game state from localStorage
 */
export function clearGameState(): void {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear game state:", error);
  }
}

/**
 * Exports game state as JSON string
 */
export function exportGameState(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Imports game state from JSON string
 */
export function importGameState(json: string): GameState | null {
  try {
    const parsed = JSON.parse(json);
    
    // Validate structure
    if (
      !parsed ||
      !Array.isArray(parsed.players) ||
      typeof parsed.buyIns !== "object" ||
      typeof parsed.finals !== "object"
    ) {
      return null;
    }
    
    return parsed as GameState;
  } catch {
    return null;
  }
}

