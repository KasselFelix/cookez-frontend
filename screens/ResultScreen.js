import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import MySmallButton from '../components/MySmallButton';
import Recipe from '../components/Recipe';
import OfflineScreen from '../components/result/OfflineScreen';
import StaleCacheBanner from '../components/result/StaleCacheBanner';
import { useConnectivity } from '../hooks/useConnectivity';
import { fetchRecipeResult } from '../modules/recipesApi';
import { getCachedResult, setCachedResult } from '../modules/recipeCache';
import { setRecipes } from '../reducers/recipe';
import { setAmazonConfig } from '../reducers/appConfig';
import buttonStyles from '../styles/Button';
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
  const dispatch = useDispatch();
  const user = useSelector((s) => s.user.value);
  const filters = useSelector((s) => s.recipeFilters.value);
  const ingredients = useSelector((s) => s.ingredient.value);
  const recipes = useSelector((s) => s.recipe.value);
  const { isConnected, isInternetReachable } = useConnectivity();

  const [staleHit, setStaleHit] = useState(false);
  const [offlineNoCache, setOfflineNoCache] = useState(false);
  // `loading` gates the list rendering — without it the screen would
  // flash the previous fetch's recipes (or the App.js boot fetch) for
  // 200-500ms before the fresh dispatch lands. Flipping it back to true
  // also forces the effect to re-evaluate via dependency invalidation
  // on the retry path.
  const [loading, setLoading] = useState(true);

  const handleRetry = useCallback(() => {
    setOfflineNoCache(false);
    setLoading(true);
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
    // Re-flag loading on every dep change so that any in-flight re-fetch
    // (filter change, retry, reconnect) suppresses the stale list until
    // the new response is dispatched. Idempotent on the first mount.
    setLoading(true);

    (async () => {
      const cacheInput = {
        userId: user?._id ?? null,
        ingredientIds: ingredients.map((i) => i.data?._id).filter(Boolean),
        origins: [...(filters.selectedOrigins || [])].sort(),
        tags: filters.selectedTags,
        servings: filters.currentServings,
      };
      const online = isConnected && isInternetReachable;
      let serverSucceeded = false;

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
            dispatch(setRecipes(tagRecipes(data.recipes, fetchedAt)));
            if (data.amazonConfig) dispatch(setAmazonConfig(data.amazonConfig));
            await setCachedResult(cacheInput, data);
            setStaleHit(false);
            serverSucceeded = true;
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Result fetch failed:', err);
          }
        }
      }

      // Step 2 — fall back to cache when the server didn't succeed
      // (offline, network error, or `data.result === false`).
      if (!serverSucceeded && !cancelled) {
        const cached = await getCachedResult(cacheInput);
        if (cached) {
          const fetchedAt = cached.data?.fetchedAtServings ?? filters?.currentServings ?? 1;
          dispatch(setRecipes(tagRecipes(cached.data?.recipes, fetchedAt)));
          if (cached.data?.amazonConfig) {
            dispatch(setAmazonConfig(cached.data.amazonConfig));
          }
          setStaleHit(cached.stale);
        } else {
          setOfflineNoCache(true);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
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
  ]);

  if (offlineNoCache) return <OfflineScreen onRetry={handleRetry} />;

  return (
    <View style={[styles.container, { backgroundColor: css.palette.accent500 }]}>
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.navigate('Recap')}
          text={<FontAwesome name="angle-double-left" size={30} color="white" />}
          buttonType={buttonStyles.buttonSmall}
        />
        <Text style={[styles.titlePage, { fontSize: css.typography.h5Size }]}>
          {t('result.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      {staleHit && <StaleCacheBanner />}
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          // While the fetch is in flight, suppress the recipes list entirely.
          // Reading `recipes.length` here would leak stale data from the
          // previous fetch (or App.js boot) for the duration of the request.
          <View
            style={styles.loader}
            accessibilityRole="progressbar"
            accessibilityLabel={t('result.title')}
          >
            <ActivityIndicator size="large" color={css.palette.surface} />
          </View>
        ) : recipes.length > 0 ? (
          recipes.map((r, i) => (
            <Recipe key={r._id || i} {...r} navigation={navigation} fromRecipeSearch />
          ))
        ) : (
          <Animatable.View
            animation="slideInDown"
            duration={700}
            style={styles.empty}
          >
            <Text>{t('result.empty.line1')}</Text>
            <Text>{t('result.empty.line2')}</Text>
          </Animatable.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: '15%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  titlePage: {},
  headerSpacer: { width: 30 },
  scroll: { marginHorizontal: '7%' },
  empty: { alignItems: 'center', marginTop: '120%' },
  loader: { alignItems: 'center', justifyContent: 'center', marginTop: '60%' },
});
