import {
  createGameRequestSchema,
  joinGameRequestSchema,
  addPlayerRequestSchema,
  updatePlayerRequestSchema,
  addBuyInRequestSchema,
  updateFinalRequestSchema,
  gameResponseSchema,
  playerResponseSchema,
  buyInResponseSchema,
  finalResponseSchema,
  gameCodeSchema,
  type CreateGameRequest,
  type JoinGameRequest,
  type AddPlayerRequest,
  type UpdatePlayerRequest,
  type AddBuyInRequest,
  type UpdateFinalRequest,
  type GameResponse,
  type PlayerResponse,
  type BuyInResponse,
  type FinalResponse,
} from "@/lib/api/schemas";

const API_BASE = "/api";

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Create a new game
 */
export async function createGame(
  request: CreateGameRequest
): Promise<GameResponse> {
  const validated = createGameRequestSchema.parse(request);
  const data = await fetchAPI<GameResponse>("/games", {
    method: "POST",
    body: JSON.stringify(validated),
  });
  return gameResponseSchema.parse(data);
}

/**
 * Get game by game code
 */
export async function getGame(gameCode: string): Promise<GameResponse> {
  const validatedCode = gameCodeSchema.parse(gameCode);
  const data = await fetchAPI<GameResponse>(`/games/${validatedCode}`);
  return gameResponseSchema.parse(data);
}

/**
 * Join a game (adds player to existing game)
 */
export async function joinGame(
  request: JoinGameRequest
): Promise<GameResponse> {
  const validated = joinGameRequestSchema.parse(request);
  // First ensure session exists
  await fetchAPI("/auth/session", { method: "POST" });
  
  // Verify game exists first
  await getGame(validated.gameCode);
  
  // Then add player and return updated game
  await addPlayer(validated.gameCode, { name: validated.playerName });
  return getGame(validated.gameCode);
}

/**
 * Add a player to a game
 */
export async function addPlayer(
  gameCode: string,
  request: AddPlayerRequest
): Promise<PlayerResponse> {
  const validatedCode = gameCodeSchema.parse(gameCode);
  const validated = addPlayerRequestSchema.parse(request);
  const data = await fetchAPI<PlayerResponse>(`/games/${validatedCode}/players`, {
    method: "POST",
    body: JSON.stringify(validated),
  });
  return playerResponseSchema.parse(data);
}

/**
 * Update player name
 */
export async function updatePlayer(
  gameCode: string,
  playerId: string,
  request: UpdatePlayerRequest
): Promise<PlayerResponse> {
  const validatedCode = gameCodeSchema.parse(gameCode);
  const validated = updatePlayerRequestSchema.parse(request);
  const data = await fetchAPI<PlayerResponse>(
    `/games/${validatedCode}/players/${playerId}`,
    {
      method: "PATCH",
      body: JSON.stringify(validated),
    }
  );
  return playerResponseSchema.parse(data);
}

/**
 * Remove a player from a game
 */
export async function removePlayer(
  gameCode: string,
  playerId: string
): Promise<void> {
  const validatedCode = gameCodeSchema.parse(gameCode);
  await fetchAPI(`/games/${validatedCode}/players/${playerId}`, {
    method: "DELETE",
  });
}

/**
 * Add a buy-in for a player
 */
export async function addBuyIn(
  gameCode: string,
  playerId: string,
  request: AddBuyInRequest
): Promise<BuyInResponse> {
  const validatedCode = gameCodeSchema.parse(gameCode);
  const validated = addBuyInRequestSchema.parse(request);
  const data = await fetchAPI<BuyInResponse>(
    `/games/${validatedCode}/players/${playerId}/buyins`,
    {
      method: "POST",
      body: JSON.stringify(validated),
    }
  );
  return buyInResponseSchema.parse(data);
}

/**
 * Remove a buy-in
 */
export async function removeBuyIn(
  gameCode: string,
  playerId: string,
  buyInId: string
): Promise<void> {
  const validatedCode = gameCodeSchema.parse(gameCode);
  await fetchAPI(
    `/games/${validatedCode}/players/${playerId}/buyins/${buyInId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Update final cashout for a player
 */
export async function updateFinal(
  gameCode: string,
  playerId: string,
  request: UpdateFinalRequest
): Promise<FinalResponse> {
  const validatedCode = gameCodeSchema.parse(gameCode);
  const validated = updateFinalRequestSchema.parse(request);
  const data = await fetchAPI<FinalResponse>(
    `/games/${validatedCode}/players/${playerId}/final`,
    {
      method: "PATCH",
      body: JSON.stringify(validated),
    }
  );
  return finalResponseSchema.parse(data);
}

