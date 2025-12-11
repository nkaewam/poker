export interface GameState {
  players: Array<{
    id: string;
    name: string;
    sessionId: string | null;
    createdAt: string;
  }>;
  buyIns: Record<string, number[]>;
  finals: Record<string, number | null>;
}
