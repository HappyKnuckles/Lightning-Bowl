export interface CacheMetadata {
  lastUpdated: number; // Unix timestamp
  version: string;
  expires: number; // Unix timestamp
}

export interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata;
}

export interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxAge: number; // Maximum age before forced refresh in milliseconds
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};