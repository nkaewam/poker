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
} from "@/lib/api/client";
import type {
  CreateGameRequest,
  JoinGameRequest,
  AddPlayerRequest,
  UpdatePlayerRequest,
  AddBuyInRequest,
  UpdateFinalRequest,
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

