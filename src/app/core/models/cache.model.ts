export interface CacheMetadata {
  lastUpdated: number;
  version: string;
  expires: number;
}

export interface CacheEntry<T> {
  data: T;
  metadata: CacheMetadata;
}

export interface CacheConfig {
  defaultTTL: number;
  maxAge: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTTL: 24 * 60 * 60 * 1000,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
