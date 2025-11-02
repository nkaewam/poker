export interface SettlementTransfer {
  fromId: string;
  toId: string;
  amount: number;
}

export interface PlayerResult {
  playerId: string;
  net: number;
}

/**
 * Calculates the minimal number of transfers needed to settle all debts.
 * Uses a greedy algorithm: always match the largest debtor with the largest creditor.
 */
export function calculateSettlement(results: PlayerResult[]): SettlementTransfer[] {
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

