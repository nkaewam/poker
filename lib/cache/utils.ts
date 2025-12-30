import { appCache } from "./index";

export interface CacheOptions {
  /**
   * Whether to cache "not found" (null/404) responses
   * Default: false - don't cache negative results
   */
  cacheNotFound?: boolean;
  /**
   * Custom TTL for "not found" responses (only used if cacheNotFound is true)
   * Default: same as ttl parameter
   */
  notFoundTtl?: number;
}

/**
 * Get a value from cache, or fetch and cache it if not present
 * @param key Cache key
 * @param ttl Time to live in seconds
 * @param fetcher Function to fetch data if cache miss
 * @param options Additional cache options
 */
export async function getCached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  try {
    const cached = await appCache.get(key);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      // If we cached a "not found" marker and cacheNotFound is false, refetch
      if (parsed === null && !options?.cacheNotFound) {
        const result = await fetcher();
        // Only cache if result exists
        if (result !== null && result !== undefined) {
          await setCache(key, result, ttl);
        }
        return result;
      }
      return parsed;
    }

    const result = await fetcher();

    // Determine if we should cache this result
    const shouldCache =
      result !== null && result !== undefined
        ? true
        : options?.cacheNotFound ?? false;

    if (shouldCache) {
      const cacheTtl =
        result === null || result === undefined
          ? options?.notFoundTtl ?? ttl
          : ttl;
      await setCache(key, result, cacheTtl);
    }

    return result;
  } catch (error) {
    // Gracefully fall back to database if Redis fails
    console.error(`Cache error for key ${key}:`, error);
    return fetcher();
  }
}

/**
 * Set a value in cache with TTL
 * @param key Cache key
 * @param value Value to cache (will be JSON stringified)
 * @param ttl Time to live in seconds
 */
export async function setCache(
  key: string,
  value: unknown,
  ttl: number
): Promise<void> {
  try {
    await appCache.set(key, JSON.stringify(value), "EX", ttl);
  } catch (error) {
    // Log but don't throw - cache failures shouldn't break the app
    console.error(`Failed to set cache for key ${key}:`, error);
  }
}

/**
 * Delete a specific cache key
 * @param key Cache key to delete
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await appCache.del(key);
  } catch (error) {
    console.error(`Failed to delete cache key ${key}:`, error);
  }
}

/**
 * Invalidate cache keys matching a pattern
 * Uses Redis SCAN to find matching keys, then deletes them
 * @param pattern Pattern to match (e.g., "game:ABC12:*")
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const stream = appCache.scanStream({
      match: pattern,
      count: 100,
    });

    const keys: string[] = [];
    stream.on("data", (resultKeys: string[]) => {
      keys.push(...resultKeys);
    });

    await new Promise<void>((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    if (keys.length > 0) {
      await appCache.del(...keys);
    }
  } catch (error) {
    console.error(`Failed to invalidate cache pattern ${pattern}:`, error);
  }
}

/**
 * Invalidate all cache keys for a specific game
 * Uses direct key deletion for better performance (no SCAN needed)
 * @param gameCode Game code (will be uppercased)
 */
export async function invalidateGameCache(gameCode: string): Promise<void> {
  const upperGameCode = gameCode.toUpperCase();
  try {
    // Delete specific keys directly (much faster than SCAN)
    await Promise.all([
      deleteCache(`game:${upperGameCode}`),
      deleteCache(`game:${upperGameCode}:logs`),
    ]);
  } catch (error) {
    console.error(`Failed to invalidate game cache for ${upperGameCode}:`, error);
  }
}
