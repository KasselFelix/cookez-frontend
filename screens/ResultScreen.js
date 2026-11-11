import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Root import as in components/kickoff/UnmatchedChips (D17).
import { ChevronLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ResultHero, ResultRow } from '../components/result/ResultCard';
import OfflineScreen from '../components/result/OfflineScreen';
import ErrorScreen from '../components/result/ErrorScreen';
import StaleCacheBanner from '../components/result/StaleCacheBanner';
import { useConnectivity } from '../hooks/useConnectivity';
import { fetchRecipeResult } from '../modules/recipesApi';
import { getCachedResult, setCachedResult } from '../modules/recipeCache';
import { selectResultRecipes, setResultRecipes } from '../reducers/recipe';
import { setAmazonConfig } from '../reducers/appConfig';
import { openRecipe } from '../modules/recipeNavigation';
import { useTheme } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';

// Phase C.9 — ResultScreen rebuilt around three pillars:
//   1. Centralized fetch via `recipesApi.fetchRecipeResult` (was inline)
//   2. AsyncStorage-backed cache (`recipeCache`) so the screen survives
//      offline reopens and stale-data scenarios
//   3. `useConnectivity` gates the network call — when the device is
//      genuinely offline we go straight to the cache instead of letting
//      `fetch` time out for ~30s before falling back
//
// State machine (resolved inside the effect):
//   online + fresh fetch ok      → dispatch fresh, write cache
//   online + fetch fails         → fall through to cache lookup
//   offline                      → skip fetch, go to cache lookup
//   cache hit (fresh or stale)   → dispatch, show StaleCacheBanner if stale
//   cache miss                   → render OfflineScreen with retry CTA
export default function ResultScreen({ navigation }) {
  const css = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.user.value);
  const filters = useSelector((s) => s.recipeFilters.value);
  const ingredients = useSelector((s) => s.ingredient.value);
  const recipes = useSelector(selectResultRecipes);
  const { isConnected, isInternetReachable } = useConnectivity();

  const [staleHit, setStaleHit] = useState(false);
  const [offlineNoCache, setOfflineNoCache] = useState(false);
  const [serverError, setServerError] = useState(false);
  // Bumped by handleRetry so a retry re-runs the effect even when filters and
  // connectivity are unchanged (retryNonce is in the effect deps below).
  const [retryNonce, setRetryNonce] = useState(0);
  // `loading` gates the list rendering — without it the screen would
  // flash the previous fetch's recipes (or the App.js boot fetch) for
  // 200-500ms before the fresh dispatch lands. Flipping it back to true
  // also forces the effect to re-evaluate via dependency invalidation
  // on the retry path.
  const [loading, setLoading] = useState(true);

  const handleRetry = useCallback(() => {
    setOfflineNoCache(false);
    setServerError(false);
    setLoading(true);
    setRetryNonce((n) => n + 1); // re-trigger the effect (deps include retryNonce)
  }, []);

  // Stable string signal for the tags & origins arrays — depending on the
  // array reference directly would re-run the effect on every render because
  // RTK rebuilds slice references on each action. Pulled out of the deps
  // array so eslint can statically verify the dependency list.
  const tagsKey = filters.selectedTags.join(',');
  const originsKey = [...(filters.selectedOrigins || [])].sort().join(',');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // 15s client timeout: a slow/hung backend must not strand the spinner.
    // A timeout abort is classified as a SERVER error, not "offline" — the
    // didTimeout flag lets the catch tell it apart from an unmount abort.
    let didTimeout = false;
    const timeoutId = setTimeout(() => { didTimeout = true; controller.abort(); }, 15000);
    // Re-flag loading on every dep change so that any in-flight re-fetch
    // (filter change, retry, reconnect) suppresses the stale list until
    // the new response is dispatched. Idempotent on the first mount.
    setLoading(true);
    setOfflineNoCache(false);
    setServerError(false);

    (async () => {
      const cacheInput = {
        userId: user?._id ?? null,
        ingredientIds: ingredients.map((i) => i.data?._id).filter(Boolean),
        origins: [...(filters.selectedOrigins || [])].sort(),
        tags: filters.selectedTags,
        servings: filters.currentServings,
        allergy: user?.settings?.allergy,
      };
      const online = isConnected && isInternetReachable;
      let serverSucceeded = false;
      let serverErrored = false; // reachable but failed

      // Tag chaque recette avec le nb de servings utilisé pour la requête.
      // RecipeScreen en a besoin pour scaler `missingIngredients` correctement
      // quand le stepper local change (les missingIngredients sont calculées
      // côté backend pour `manualServings`, pas pour `recipe.servings`).
      const tagRecipes = (recipes, fetchedAtServings) =>
        (recipes || []).map((r) => ({ ...r, _fetchedAtServings: fetchedAtServings }));

      // Step 1 — only attempt a network fetch when we're plausibly online.
      // The AbortController cancels the request if the screen unmounts
      // before the response arrives.
      if (online) {
        try {
          const data = await fetchRecipeResult({
            token: user?.token,
            ingredients,
            filters,
            allergy: user?.settings?.allergy,
            signal: controller.signal,
          });
          if (cancelled) return;
          if (data?.result) {
            const fetchedAt = filters?.currentServings ?? 1;
            dispatch(setResultRecipes(tagRecipes(data.recipes, fetchedAt)));
            if (data.amazonConfig) dispatch(setAmazonConfig(data.amazonConfig));
            await setCachedResult(cacheInput, data);
            setStaleHit(false);
            serverSucceeded = true;
          }
        } catch (err) {
          if (cancelled) return;
          if (err.name === 'AbortError' && !didTimeout) return; // unmount — say nothing
          // Surface the REAL error (lost today). A 5xx/4xx or a timeout while the
          // device is online is a SERVER problem, not "you're offline".
          console.warn('Result fetch failed:', err?.status ?? 'network', err?.message);
          if (online && (err?.status || didTimeout)) serverErrored = true;
        }
      }
      clearTimeout(timeoutId);

      // Step 2 — cache fallback when not a server error (offline / data.result=false).
      if (!serverSucceeded && !serverErrored && !cancelled) {
        const cached = await getCachedResult(cacheInput);
        if (cached) {
          const fetchedAt = cached.data?.fetchedAtServings ?? filters?.currentServings ?? 1;
          dispatch(setResultRecipes(tagRecipes(cached.data?.recipes, fetchedAt)));
          if (cached.data?.amazonConfig) {
            dispatch(setAmazonConfig(cached.data.amazonConfig));
          }
          setStaleHit(cached.stale);
        } else {
          setOfflineNoCache(true);
        }
      }

      // Step 3 — server reachable but errored: prefer stale cache (with banner),
      // else surface the ErrorScreen (NOT the offline lie).
      if (serverErrored && !cancelled) {
        const cached = await getCachedResult(cacheInput);
        if (cached) {
          const fetchedAt = cached.data?.fetchedAtServings ?? filters?.currentServings ?? 1;
          dispatch(setResultRecipes(tagRecipes(cached.data?.recipes, fetchedAt)));
          if (cached.data?.amazonConfig) {
            dispatch(setAmazonConfig(cached.data.amazonConfig));
          }
          setStaleHit(true);
        } else {
          setServerError(true);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
    // `filters` itself is intentionally NOT in the dep list — its
    // identity changes on every action; we depend on the three concrete
    // primitives (originsKey, tagsKey, currentServings) that drive
    // the request shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    originsKey,
    tagsKey,
    filters.currentServings,
    ingredients,
    isConnected,
    isInternetReachable,
    user?.token,
    user?._id,
    user?.settings?.allergy,
    dispatch,
    retryNonce,
  ]);

  if (offlineNoCache) return <OfflineScreen onRetry={handleRetry} />;
  if (serverError) return <ErrorScreen onRetry={handleRetry} />;

  const open = (recipe) => openRecipe(navigation, recipe, { fromRecipeSearch: true });
  const [best, ...others] = loading ? [] : recipes;

  // Hierarchy: the best match as a large photo, then compact rows; time,
  // difficulty and rating come after the name and the owned share.
  return (
    <View testID="result-screen" style={[styles.container, { backgroundColor: css.result.background, paddingTop: insets.top + css.spacing.md }]}>
      <View style={[styles.header, { gap: css.spacing.md, paddingHorizontal: css.spacing.md, paddingBottom: css.spacing.md }]}>
        <Pressable
          testID="result-back"
          onPress={() => navigation.navigate('Recap')}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => [
            styles.back,
            { backgroundColor: css.flow.actionBg, borderRadius: css.radius.pill, opacity: pressed ? 0.8 : 1 },
            css.shadow.sm,
          ]}
        >
          <ChevronLeft size={22} strokeWidth={2.5} color={css.flow.actionIcon} />
        </Pressable>
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={{ fontFamily: css.typography.fontDisplay, fontSize: css.typography.h2Size, color: css.result.ink, fontWeight: '700' }}>
            {t('result.title')}
          </Text>
          {!loading && recipes.length > 0 && (
            <Text style={{ fontFamily: css.typography.fontBody, fontSize: css.typography.bodySmSize, color: css.result.muted }}>
              {t('result.subtitle', { count: recipes.length })}
            </Text>
          )}
        </View>
      </View>
      {staleHit && <StaleCacheBanner />}
      {loading ? (
        // While the fetch is in flight, suppress the recipes list entirely.
        // Reading `recipes.length` here would leak stale data from the
        // previous fetch (or App.js boot) for the duration of the request.
        <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={t('result.title')}>
          <ActivityIndicator size="large" color={css.result.meterFill} />
        </View>
      ) : recipes.length > 0 ? (
        <FlatList
          data={others}
          keyExtractor={(r, i) => r._id || String(i)}
          ListHeaderComponent={<ResultHero recipe={best} onPress={() => open(best)} />}
          renderItem={({ item }) => <ResultRow recipe={item} onPress={() => open(item)} />}
          contentContainerStyle={{ paddingHorizontal: css.spacing.md, paddingBottom: insets.bottom + css.spacing.xl, gap: css.spacing.sm }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={[styles.center, { paddingHorizontal: css.spacing.xl, gap: css.spacing.xs }]}>
          <Text style={{ fontFamily: css.typography.fontHeading, fontSize: css.typography.h4Size, color: css.result.ink, textAlign: 'center' }}>
            {t('result.empty.line1')}
          </Text>
          <Text style={{ fontFamily: css.typography.fontBody, fontSize: css.typography.bodySize, color: css.result.muted, textAlign: 'center' }}>
            {t('result.empty.line2')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
