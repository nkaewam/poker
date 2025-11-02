import { z } from "zod";

// Game code validation (5 characters, alphanumeric, case-insensitive)
export const gameCodeSchema = z
  .string()
  .length(5, "Game code must be 5 characters")
  .regex(/^[A-Z0-9]+$/, "Game code must contain only letters and numbers")
  .transform((val) => val.toUpperCase());

// Player name validation
export const playerNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name must be less than 50 characters")
  .trim();

// Amount validation (positive decimal)
export const amountSchema = z
  .number()
  .positive("Amount must be positive")
  .finite();

// Request schemas
export const createGameRequestSchema = z.object({
  playerName: playerNameSchema,
});

export const joinGameRequestSchema = z.object({
  gameCode: gameCodeSchema,
  playerName: playerNameSchema,
});

export const addPlayerRequestSchema = z.object({
  name: playerNameSchema,
});

export const updatePlayerRequestSchema = z.object({
  name: playerNameSchema,
});

export const addBuyInRequestSchema = z.object({
  amount: amountSchema,
});

export const updateFinalRequestSchema = z.object({
  amount: z.number().nonnegative("Amount must be non-negative").finite(),
});

// Response schemas
export const playerResponseSchema = z.object({
  id: z.string().uuid(),
  gameId: z.number(),
  sessionId: z.string().uuid().nullable(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export const buyInResponseSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string().uuid(),
  amount: z.string(), // Decimal returned as string from database
  createdAt: z.string().datetime(),
});

export const finalResponseSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string().uuid(),
  amount: z.string(), // Decimal returned as string from database
  createdAt: z.string().datetime(),
});

export const gameResponseSchema = z.object({
  id: z.number(),
  gameCode: z.string(),
  createdAt: z.string().datetime(),
  players: z.array(playerResponseSchema),
  buyIns: z.array(buyInResponseSchema),
  finals: z.array(finalResponseSchema),
});

export const sessionResponseSchema = z.object({
  id: z.string().uuid(),
  token: z.string(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

// Type exports
export type CreateGameRequest = z.infer<typeof createGameRequestSchema>;
export type JoinGameRequest = z.infer<typeof joinGameRequestSchema>;
export type AddPlayerRequest = z.infer<typeof addPlayerRequestSchema>;
export type UpdatePlayerRequest = z.infer<typeof updatePlayerRequestSchema>;
export type AddBuyInRequest = z.infer<typeof addBuyInRequestSchema>;
export type UpdateFinalRequest = z.infer<typeof updateFinalRequestSchema>;

export type PlayerResponse = z.infer<typeof playerResponseSchema>;
export type BuyInResponse = z.infer<typeof buyInResponseSchema>;
export type FinalResponse = z.infer<typeof finalResponseSchema>;
export type GameResponse = z.infer<typeof gameResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

