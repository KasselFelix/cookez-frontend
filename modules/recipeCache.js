import AsyncStorage from '@react-native-async-storage/async-storage';

// Offline-friendly cache for /recipes/result responses.
//
// Why this design:
//   - We can't rely on the user having network when they re-open the app
//     after browsing recipes. AsyncStorage is the only persistence layer
//     available without a new dependency.
//   - The key is derived from the *request shape* (ingredients + filters
//     + servings) so re-running the same search hits the cache, but
//     changing any filter misses cleanly.
//   - The 5-entry FIFO cap is intentional: cached recipe payloads are
//     fat (full nutrition snapshots + populated comments) and we don't
//     want to bloat AsyncStorage. The index file lets us evict the
//     oldest entry without listing every key in storage.
//   - The 24h TTL flags entries as `stale` rather than deleting them —
//     callers (ResultScreen, Phase C) can show stale data while a fresh
//     request is in flight, then swap on resolve.

const PREFIX = 'recipeCache:';
const INDEX_KEY = 'recipeCache:_index';
const MAX_ENTRIES = 5;
const TTL_MS = 24 * 60 * 60 * 1000;

// Stable key derivation. Sorting `ingredientIds` and `tags` means the
// caller doesn't have to worry about array order — two equivalent
// requests always produce the same key. `userId ?? 'anon'` so logged-out
// users still get caching without colliding with each other across
// device handoffs (unlikely in practice but cheap to guard).
export function makeCacheKey({ userId, ingredientIds, origins, tags, servings }) {
  const ids = [...(ingredientIds || [])].sort().join(',');
  const ts = [...(tags || [])].sort().join(',');
  const os = [...(origins || [])].sort().join(',');
  return `${PREFIX}${userId ?? 'anon'}:${ids}:${os}:${ts}:${servings ?? ''}`;
}

// Returns `{ data, stale }` or null on miss / parse failure.
// Stale entries are intentionally surfaced so the UI can show them
// while a fresh fetch is pending.
export async function getCachedResult(input) {
  try {
    const key = makeCacheKey(input);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    return { data, stale: Date.now() - ts > TTL_MS };
  } catch (err) {
    console.warn('recipeCache.get failed:', err);
    return null;
  }
}

// Write-through cache with FIFO eviction. The index entry is moved to
// the tail on every write — so "freshness" here means "most recently
// written" rather than "most recently read". Good enough; result
// payloads only get rewritten when the user reruns the search.
export async function setCachedResult(input, data) {
  try {
    const key = makeCacheKey(input);
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    const indexRaw = await AsyncStorage.getItem(INDEX_KEY);
    const index = indexRaw ? JSON.parse(indexRaw) : [];
    const filtered = index.filter((k) => k !== key);
    filtered.push(key);
    while (filtered.length > MAX_ENTRIES) {
      const oldest = filtered.shift();
      await AsyncStorage.removeItem(oldest);
    }
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('recipeCache.set failed:', err);
  }
}

// Bulk wipe — called from the logout handler (B.7). Iterating the
// index file instead of `AsyncStorage.getAllKeys()` keeps the blast
// radius limited to our own keys and avoids touching unrelated app
// storage.
export async function clearCache() {
  try {
    const indexRaw = await AsyncStorage.getItem(INDEX_KEY);
    const index = indexRaw ? JSON.parse(indexRaw) : [];
    for (const key of index) await AsyncStorage.removeItem(key);
    await AsyncStorage.removeItem(INDEX_KEY);
  } catch (err) {
    console.warn('recipeCache.clear failed:', err);
  }
}
