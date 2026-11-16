// useCatalogRecipes — the Dashboard catalog (GET /recipes/all) and its
// loading state.
//
// App.js fires a boot fetch on mount, but it can fail silently (Vercel cold
// start, network blip). The Dashboard therefore loads the catalog again on
// mount: without this fallback the screen would lock on the spinner.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import addressIp from '../modules/addressIp';
import { selectCatalogRecipes, setCatalogRecipes } from '../reducers/recipe';

/**
 * @returns {{
 *   recipes: object[],
 *   isLoading: boolean,
 *   loadError: boolean,
 *   reload: () => Promise<void>,
 * }}
 */
export default function useCatalogRecipes() {
  const dispatch = useDispatch();
  const recipes = useSelector(selectCatalogRecipes);
  // Loading only matters while the catalog is cold.
  const [isLoading, setIsLoading] = useState(recipes.length === 0);
  const [loadError, setLoadError] = useState(false);
  // One request at a time, even when retry is tapped during a load.
  const isFetchingRef = useRef(false);

  const reload = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadError(false);
    setIsLoading(true);
    try {
      const response = await fetch(`${addressIp}/recipes/all`);
      const data = await response.json();
      if (data?.result && Array.isArray(data.recipes)) {
        dispatch(setCatalogRecipes(data.recipes));
      } else if (response.ok && data?.result === false) {
        // 200 with result false: the database has no recipe. Nothing is
        // dispatched, so a catalog already loaded stays; with none, the
        // screen shows its empty state (not loading, no error).
      } else {
        setLoadError(true);
      }
    } catch (error) {
      console.error('useCatalogRecipes:', error?.message);
      setLoadError(true);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [dispatch]);

  // Always reload on mount: the catalog may be stale, or the boot fetch may
  // have failed. The request is idempotent and cheap (Vercel edge cache).
  useEffect(() => {
    reload();
  }, [reload]);

  return { recipes, isLoading, loadError, reload };
}
