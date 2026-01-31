/**
 * Simple in-memory cache for tech stack results
 * TTL-based expiration, no database needed
 */

const cache = new Map();
const DEFAULT_TTL_HOURS = 24;

/**
 * Get cached result if not expired
 */
export function getCache(domain) {
  const entry = cache.get(domain);
  if (!entry) return null;

  const ttlHours = parseInt(process.env.CACHE_TTL_HOURS) || DEFAULT_TTL_HOURS;
  const age = Date.now() - entry.timestamp;
  const maxAge = ttlHours * 60 * 60 * 1000;

  if (age > maxAge) {
    cache.delete(domain);
    return null;
  }

  return {
    ...entry.data,
    cached: true,
    cache_age_hours: Math.round(age / 3600000)
  };
}

/**
 * Store result in cache
 */
export function setCache(domain, data) {
  cache.set(domain, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    entries: cache.size,
    domains: Array.from(cache.keys())
  };
}

/**
 * Clear all cache
 */
export function clearCache() {
  const count = cache.size;
  cache.clear();
  return count;
}
