// useRecipeSearch — the Dashboard's server search by name (plan 013),
// debounced; an answer to an older query never shows.
import { useEffect, useState } from 'react';

import addressIp from '../modules/addressIp';

// The search runs on the server from this many characters: the dashboard only
// holds the 200 most recent recipes, the catalog has thousands (plan 013).
export const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 250;

/**
 * @param {string} query - the raw text of the search field
 * @returns {{ isSearching: boolean, searchResults: object[] }}
 */
export default function useRecipeSearch(query) {
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= SEARCH_MIN_LENGTH;
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${addressIp}/recipes/search?q=${encodeURIComponent(trimmedQuery)}&limit=50`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!controller.signal.aborted) {
          setSearchResults(data?.result && Array.isArray(data.recipes) ? data.recipes : []);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('useRecipeSearch:', error?.message);
          // Never leave the previous query's results under the new one.
          setSearchResults([]);
        }
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isSearching, trimmedQuery]);

  return { isSearching, searchResults };
}
