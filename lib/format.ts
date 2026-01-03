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
  const cleaned = value.replace(/[฿$,\s]/g, "").trim();

  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

/**
 * Formats an ISO date time string as a relative time description
 * Returns strings like "5 mins ago", "2 hours ago", "3 days ago", etc.
 */
export function formatRelativeTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates
  if (diffInSeconds < 0) {
    return "just now";
  }

  // Seconds
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "min" : "mins"} ago`;
  }

  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  // Days
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  // Weeks
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  // Months (approximate)
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  // Years
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
}
