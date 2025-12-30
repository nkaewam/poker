"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGame,
  getGame,
  joinGame,
  addPlayer,
  updatePlayer,
  addBuyIn,
  removeBuyIn,
  updateFinal,
  getLastPlayerName,
  getSession,
  getGameLogs,
  getUserNickname,
  updateUserNickname,
  updateSettlementMode,
  getUserIconPreferences,
  updateUserIconPreferences,
  getUserIconPreferencesBySession,
} from "@/lib/api/client";
import type {
  CreateGameRequest,
  JoinGameRequest,
  AddPlayerRequest,
  UpdatePlayerRequest,
  AddBuyInRequest,
  UpdateFinalRequest,
  UpdateSettlementModeRequest,
} from "@/lib/api/schemas";

/**
 * Query key factory
 */
export const gameKeys = {
  all: ["games"] as const,
  detail: (gameCode: string) => [...gameKeys.all, gameCode] as const,
};

/**
 * Get game by code with 5-second polling
 */
export function useGame(gameCode: string | undefined) {
  return useQuery({
    queryKey: gameKeys.detail(gameCode!),
    queryFn: () => getGame(gameCode!),
    enabled: !!gameCode,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

/**
 * Create a new game
 */
export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateGameRequest) => createGame(request),
    onSuccess: (data) => {
      queryClient.setQueryData(gameKeys.detail(data.gameCode), data);
    },
  });
}

/**
 * Join an existing game
 */
export function useJoinGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: JoinGameRequest) => joinGame(request),
    onSuccess: (data) => {
      queryClient.setQueryData(gameKeys.detail(data.gameCode), data);
    },
  });
}

/**
 * Add a player to a game
 */
export function useAddPlayer(gameCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddPlayerRequest) => addPlayer(gameCode, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameCode) });
    },
  });
}

/**
 * Update player name
 */
export function useUpdatePlayer(gameCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      ...request
    }: UpdatePlayerRequest & { playerId: string }) =>
      updatePlayer(gameCode, playerId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameCode) });
    },
  });
}

/**
 * Add a buy-in for a player
 */
export function useAddBuyIn(gameCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      ...request
    }: AddBuyInRequest & { playerId: string }) =>
      addBuyIn(gameCode, playerId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameCode) });
    },
  });
}

/**
 * Remove a buy-in
 */
export function useRemoveBuyIn(gameCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      buyInId,
    }: {
      playerId: string;
      buyInId: string;
    }) => removeBuyIn(gameCode, playerId, buyInId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameCode) });
    },
  });
}

/**
 * Update final cashout for a player
 */
export function useUpdateFinal(gameCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playerId,
      ...request
    }: UpdateFinalRequest & { playerId: string }) =>
      updateFinal(gameCode, playerId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameCode) });
    },
  });
}

/**
 * Get the last player name used in the current session
 */
export function useLastPlayerName() {
  return useQuery({
    queryKey: ["session", "last-player-name"],
    queryFn: () => getLastPlayerName(),
    staleTime: Infinity, // This data doesn't change often
  });
}

/**
 * Get the current session
 */
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => getSession(),
    staleTime: Infinity, // Session doesn't change during the app lifecycle
  });
}

/**
 * Get game logs
 */
export function useGameLogs(gameCode: string | undefined) {
  return useQuery({
    queryKey: [...gameKeys.detail(gameCode!), "logs"],
    queryFn: () => getGameLogs(gameCode!),
    enabled: !!gameCode,
    refetchInterval: 2000, // Poll every 2 seconds to keep logs up to date
  });
}

/**
 * Get the user's nickname (if authenticated)
 */
export function useUserNickname() {
  return useQuery({
    queryKey: ["user", "nickname"],
    queryFn: () => getUserNickname(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update the user's nickname (if authenticated)
 */
export function useUpdateUserNickname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nickname: string) => updateUserNickname(nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "nickname"] });
      queryClient.refetchQueries({ queryKey: ["user", "nickname"] });
      // Invalidate all game queries since the backend updates all player records
      // for this user's sessions, which affects game state
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
    },
  });
}

/**
 * Update settlement mode for a game
 */
export function useUpdateSettlementMode(gameCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateSettlementModeRequest) =>
      updateSettlementMode(gameCode, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameCode) });
    },
  });
}

/**
 * Get the user's icon preferences (if authenticated)
 */
export function useUserIconPreferences() {
  return useQuery({
    queryKey: ["user", "icon"],
    queryFn: () => getUserIconPreferences(),
    staleTime: 0, // Always consider data stale to ensure immediate updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Update the user's icon preferences (if authenticated)
 */
export function useUpdateUserIconPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: {
      patternType?: "grid" | "dots" | "lines" | "shapes";
      borderShape?: "wavy" | "zigzag" | "scalloped" | "spiked" | "rounded" | "smooth";
      iconSeed?: string;
      iconColor?: string;
    }) => updateUserIconPreferences(request),
    onSuccess: async () => {
      // Invalidate queries - this automatically triggers a refetch for active queries
      await queryClient.invalidateQueries({ queryKey: ["user", "icon"], refetchType: "active" });
      // Also invalidate session icon queries since user preferences affect all sessions
      await queryClient.invalidateQueries({ queryKey: ["user", "icon", "session"] });
    },
  });
}

/**
 * Get user icon preferences by sessionId
 */
export function useUserIconPreferencesBySession(sessionId: string | null) {
  return useQuery({
    queryKey: ["user", "icon", "session", sessionId],
    queryFn: () => getUserIconPreferencesBySession(sessionId),
    enabled: !!sessionId,
    staleTime: 0, // Always consider data stale to ensure immediate updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
