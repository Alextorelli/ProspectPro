/**
 * Centralized TTL Cache for ProspectPro
 * Provides in-memory caching with TTL for API responses, domain data, etc.
 */

class TTLCache {
  constructor(defaultTTL = 300000) {
    // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set a value with TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get a value if not expired
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a key
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats() {
    let expired = 0;
    let active = 0;
    const now = Date.now();

    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expired++;
      } else {
        active++;
      }
    }

    return { active, expired, total: this.cache.size };
  }

  /**
   * Generate cache key from object/params
   */
  static generateKey(prefix, params) {
    if (typeof params === "string") return `${prefix}:${params}`;
    if (typeof params === "object") {
      const sorted = Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&");
      return `${prefix}:${sorted}`;
    }
    return `${prefix}:${String(params)}`;
  }
}

// Singleton cache instance
const globalCache = new TTLCache();

// Periodic cleanup every 5 minutes
setInterval(() => globalCache.cleanup(), 300000);

module.exports = { TTLCache, globalCache };
