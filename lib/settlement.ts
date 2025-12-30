export interface SettlementTransfer {
  fromId: string;
  toId: string;
  amount: number;
}

export interface PlayerResult {
  playerId: string;
  net: number;
  final?: number; // Final balance (amount player has at end of game)
}

export type SettlementMode = "COLLECTOR" | "PEER_TO_PEER";

/**
 * Calculates settlement transfers for COLLECTOR mode.
 * In collector mode, it's assumed that all players already gave their buy-ins to the collector
 * prior to starting or during every new buy-in. The collector pays each player their final balance
 * (the amount they have at the end of the game). No transfers from players to the collector are needed.
 */
export function calculateCollectorSettlement(
  results: PlayerResult[],
  collectorPlayerId: string
): SettlementTransfer[] {
  const transfers: SettlementTransfer[] = [];
  const collectorResult = results.find((r) => r.playerId === collectorPlayerId);

  if (!collectorResult) {
    throw new Error(`Collector player ${collectorPlayerId} not found in results`);
  }

  // Collector pays each player their final balance
  // If final is not provided, calculate it from net and buy-ins (for backward compatibility)
  for (const result of results) {
    if (result.playerId === collectorPlayerId) {
      continue; // Skip collector themselves
    }

    // Use final if available, otherwise skip (final should always be available)
    const finalAmount = result.final;
    
    // Only create transfer if player has a positive final balance
    if (finalAmount !== undefined && finalAmount > 0) {
      transfers.push({
        fromId: collectorPlayerId,
        toId: result.playerId,
        amount: finalAmount,
      });
    }
  }

  return transfers;
}

/**
 * Calculates the minimal number of transfers needed to settle all debts.
 * Uses a greedy algorithm: always match the largest debtor with the largest creditor.
 */
export function calculatePeerToPeerSettlement(
  results: PlayerResult[]
): SettlementTransfer[] {
  const transfers: SettlementTransfer[] = [];

  // Separate creditors (net > 0) and debtors (net < 0)
  const creditors = results
    .filter((r) => r.net > 0)
    .map((r) => ({ ...r, net: r.net }))
    .sort((a, b) => b.net - a.net); // Sort descending

  const debtors = results
    .filter((r) => r.net < 0)
    .map((r) => ({ ...r, net: Math.abs(r.net) }))
    .sort((a, b) => b.net - a.net); // Sort descending

  let creditorIdx = 0;
  let debtorIdx = 0;

  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];

    const amount = Math.min(creditor.net, debtor.net);

    transfers.push({
      fromId: debtor.playerId,
      toId: creditor.playerId,
      amount,
    });

    creditor.net -= amount;
    debtor.net -= amount;

    if (creditor.net === 0) {
      creditorIdx++;
    }
    if (debtor.net === 0) {
      debtorIdx++;
    }
  }

  return transfers;
}

/**
 * Calculates settlement transfers based on the settlement mode.
 * Maintains backward compatibility by defaulting to PEER_TO_PEER mode.
 */
export function calculateSettlement(
  results: PlayerResult[],
  mode: SettlementMode = "PEER_TO_PEER",
  collectorPlayerId?: string | null
): SettlementTransfer[] {
  if (mode === "COLLECTOR") {
    if (!collectorPlayerId) {
      throw new Error("Collector player ID is required for COLLECTOR settlement mode");
    }
    return calculateCollectorSettlement(results, collectorPlayerId);
  }
  return calculatePeerToPeerSettlement(results);
}
