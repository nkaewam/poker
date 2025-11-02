export interface GameState {
  players: Array<{ id: string; name: string }>;
  buyIns: Record<string, number[]>;
  finals: Record<string, number | null>;
}

