/**
 * Formats a number as currency (THB)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parses a currency string to a number
 * Handles common formats like "฿100", "100.50", "100,000", etc.
 */
export function parseCurrency(value: string): number {
  if (!value || value.trim() === "") {
    return 0;
  }
  
  // Remove currency symbols (฿, $), commas, and whitespace
  const cleaned = value
    .replace(/[฿$,\s]/g, "")
    .trim();
  
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    return 0;
  }
  
  return Math.max(0, parsed);
}

