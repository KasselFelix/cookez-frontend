import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SlidersHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import FiltersModal from "../components/FiltersModal";
import { useTheme } from "../contexts/ThemeProvider";
import useTabBarHeight from "../hooks/useTabBarHeight";
import useT from "../i18n/useT";
import addressIp from "../modules/addressIp";
import { setRecipes } from "../reducers/recipe";

// Recently Viewed cards scale with the viewport so small devices (iPhone SE
// ~375pt) don't get oversized images while wider devices keep good density.
// ~42% of the screen yields ~2.3 cards visible at a glance; clamped to keep
// the layout legible at both extremes. Aspect ratio 4:5 (height = w * 1.1)
// gives the gradient overlay room for a 2-line title + 5 stars without the
// previous 3:4 portrait shape that wasted vertical space.
const STAFF_CARD_WIDTH_RATIO = 0.42;
const STAFF_CARD_MIN_WIDTH = 140;
const STAFF_CARD_MAX_WIDTH = 180;
const STAFF_CARD_ASPECT = 1.1;
const COMMUNITY_CARD_HEIGHT = 100;
const COMMUNITY_IMAGE_WIDTH_RATIO = 0.35;

const FILTERS = ["All", "Quick", "Vegan", "Dessert", "Trending"];

function renderStars(votes, size = 13, css) {
  const avg = votes?.length
    ? votes.reduce((s, v) => s + v.note, 0) / votes.length
    : 0;
  const rounded = Math.floor(avg);

  return Array.from({ length: 5 }, (_, i) => (
    <FontAwesome
      key={i}
      name="star"
      size={size}
      color={i < rounded ? css.palette.warning : css.palette.neutral300}
    />
  ));
}

function applyFilter(recipes, filter) {
  switch (filter) {
    case "Quick":
      return recipes.filter((r) => r.preparationTime <= 20);
    case "Vegan":
      return recipes.filter((r) =>
        r.tags?.some?.((tag) => tag?.toLowerCase() === "vegan")
      );
    case "Dessert":
      return recipes.filter((r) =>
        r.tags?.some?.((tag) => tag?.toLowerCase() === "dessert")
      );
    case "Trending":
      return recipes.filter((r) => {
        const votes = r.votes ?? [];
        if (votes.length < 5) return false;
        const avg = votes.reduce((sum, v) => sum + (v?.note ?? 0), 0) / votes.length;
        return avg >= 4.0;
      });
    default:
      return recipes;
  }
}

function recipeAvgNote(votes) {
  if (!Array.isArray(votes) || votes.length === 0) return 0;
  return votes.reduce((sum, v) => sum + (v?.note ?? 0), 0) / votes.length;
}

// Bayesian-weighted score: combines rating quality and vote volume so a
// 5★/1-vote recipe doesn't outrank a 4★/50-votes one. See IMDb Top 250.
function bayesianRank(recipes, m = 3) {
  const rated = recipes.filter((r) => Array.isArray(r.votes) && r.votes.length > 0);
  const C = rated.length
    ? rated.reduce((sum, r) => sum + recipeAvgNote(r.votes), 0) / rated.length
    : 0;
  return [...recipes]
    .map((r) => {
      const v = r.votes?.length ?? 0;
      const R = recipeAvgNote(r.votes);
      const score = v + m === 0 ? 0 : (v / (v + m)) * R + (m / (v + m)) * C;
      return { recipe: r, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ recipe }) => recipe);
}

export default function UserDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);
  const recipes = useSelector((state) => state.recipe.value);
  const t = useT();
  const css = useTheme();
  const tabBarHeight = useTabBarHeight();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive staff card dimensions — recomputed on rotation / split-view.
  const staffCardWidth = useMemo(() => {
    const target = screenWidth * STAFF_CARD_WIDTH_RATIO;
    return Math.round(Math.min(STAFF_CARD_MAX_WIDTH, Math.max(STAFF_CARD_MIN_WIDTH, target)));
  }, [screenWidth]);
  const staffCardHeight = Math.round(staffCardWidth * STAFF_CARD_ASPECT);

  // Loading only matters while the Redux cache is cold. App.js fires a boot
  // fetch for /recipes/all on mount, but it can fail silently (Vercel cold
  // start, network blip, data.result === false). Without our own fetch as a
  // fallback, this screen would lock on the spinner forever.
  const [isLoading, setIsLoading] = useState(recipes.length === 0);
  const [loadError, setLoadError] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [requiredTags, setRequiredTags] = useState([]);
  const [excludedTags, setExcludedTags] = useState([]);
  const [requiredOrigins, setRequiredOrigins] = useState([]);
  const [excludedOrigins, setExcludedOrigins] = useState([]);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);

  // Guards against double-mount (screen is registered in both Stack and Tab
  // navigators — known tech debt).
  const isFetchingRef = useRef(false);

  const hydrateRecipes = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadError(false);
    setIsLoading(true);
    try {
      const response = await fetch(`${addressIp}/recipes/all`);
      const data = await response.json();
      if (data?.result && Array.isArray(data.recipes)) {
        dispatch(setRecipes(data.recipes));
      } else {
        setLoadError(true);
      }
    } catch (error) {
      console.error("UserDashboardScreen.hydrateRecipes:", error?.message);
      setLoadError(true);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [dispatch]);

  // Always re-hydrate on mount: the Redux cache may have been populated by
  // a different endpoint (e.g. POST /recipes/result on ResultScreen which
  // returns a different shape) and the cached recipes would be missing
  // dashboard-only fields like imageUrl. The fetch is idempotent and cheap
  // (Vercel edge cache), so the safety > the bandwidth cost.
  useEffect(() => {
    hydrateRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const fetchRecentlyViewed = useCallback(async () => {
    if (!user?.token) {
      setRecentlyViewed([]);
      return;
    }
    try {
      const response = await fetch(`${addressIp}/users/lastViewed/${user.token}`);
      const data = await response.json();
      setRecentlyViewed(data?.result && Array.isArray(data.recipes) ? data.recipes : []);
    } catch {
      setRecentlyViewed([]);
    }
  }, [user?.token]);

  useFocusEffect(useCallback(() => { fetchRecentlyViewed(); }, [fetchRecentlyViewed]));

  const availableOrigins = useMemo(
    () => Array.from(new Set(recipes.flatMap((r) => r.origin ?? []))).sort(),
    [recipes]
  );

  const activeFiltersCount =
    requiredTags.length +
    excludedTags.length +
    requiredOrigins.length +
    excludedOrigins.length;

  const communityRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = applyFilter(recipes, activeFilter);
    if (q.length > 0) {
      filtered = filtered.filter((r) => r.name?.toLowerCase().includes(q));
    }
    // Tag filters
    if (requiredTags.length > 0) {
      filtered = filtered.filter((r) =>
        requiredTags.every((tag) =>
          r.tags?.some((t) => t?.toLowerCase() === tag)
        )
      );
    }
    if (excludedTags.length > 0) {
      filtered = filtered.filter(
        (r) =>
          !excludedTags.some((tag) =>
            r.tags?.some((t) => t?.toLowerCase() === tag)
          )
      );
    }
    // Origin filters (OR for required, NOT for excluded)
    if (requiredOrigins.length > 0) {
      filtered = filtered.filter((r) =>
        r.origin?.some((o) => requiredOrigins.includes(o))
      );
    }
    if (excludedOrigins.length > 0) {
      filtered = filtered.filter(
        (r) => !r.origin?.some((o) => excludedOrigins.includes(o))
      );
    }
    // Sort (existing logic)
    if (activeFilter === "All" || activeFilter === "Vegan" || activeFilter === "Dessert") {
      return bayesianRank(filtered).slice(0, 15);
    }
    if (activeFilter === "Quick") {
      return [...filtered]
        .sort((a, b) => (a.preparationTime ?? Infinity) - (b.preparationTime ?? Infinity))
        .slice(0, 15);
    }
    return [...filtered].reverse().slice(0, 15);
  }, [
    recipes,
    activeFilter,
    searchQuery,
    requiredTags,
    excludedTags,
    requiredOrigins,
    excludedOrigins,
  ]);

  const navigateToRecipe = useCallback(
    (recipe) => {
      navigation.navigate("Recipe", { recipe });
    },
    [navigation]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('userDashboard.greeting.morning');
    if (hour < 18) return t('userDashboard.greeting.afternoon');
    return t('userDashboard.greeting.evening');
  }, [t]);

  // ─── Loading state ───
  if (isLoading && recipes.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: css.palette.surface }]}>
        <ActivityIndicator
          size="large"
          color={css.palette.primary500}
          accessibilityLabel={t('userDashboard.loadingA11y')}
        />
        <Text
          style={[
            styles.loadingText,
            {
              marginTop: css.spacing.md,
              fontFamily: css.typography.fontBody,
              fontSize: css.typography.bodySize,
              color: css.palette.neutral500,
            },
          ]}
        >
          {t('userDashboard.loading')}
        </Text>
      </View>
    );
  }

  // ─── Error state ─── (cache cold AND fetch failed)
  if (!isLoading && loadError && recipes.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: css.palette.surface, paddingHorizontal: css.spacing.xl },
        ]}
      >
        <FontAwesome name="exclamation-triangle" size={48} color={css.palette.neutral300} />
        <Text
          style={[
            styles.emptyTitle,
            {
              marginTop: css.spacing.md,
              fontFamily: css.typography.fontHeading,
              fontSize: css.typography.h3Size,
              color: css.palette.neutral900,
            },
          ]}
        >
          {t('userDashboard.error.title')}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            {
              marginTop: css.spacing.xs,
              fontFamily: css.typography.fontBody,
              fontSize: css.typography.bodySize,
              color: css.palette.neutral500,
            },
          ]}
        >
          {t('userDashboard.error.subtitle')}
        </Text>
        <TouchableOpacity
          style={[
            styles.emptyCtaButton,
            {
              marginTop: css.spacing.lg,
              backgroundColor: css.palette.primary800,
              paddingVertical: css.button.primaryPaddingV,
              paddingHorizontal: css.button.primaryPaddingH,
              borderRadius: css.radius.pill,
            },
          ]}
          onPress={hydrateRecipes}
          accessibilityRole="button"
          accessibilityLabel={t('userDashboard.error.retryA11y')}
        >
          <Text
            style={[
              styles.emptyCtaText,
              {
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.bodySize,
                color: css.palette.white,
              },
            ]}
          >
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Empty state ─── (loaded successfully but database is empty)
  if (!isLoading && recipes.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: css.palette.surface, paddingHorizontal: css.spacing.xl },
        ]}
      >
        <FontAwesome name="cutlery" size={48} color={css.palette.neutral300} />
        <Text
          style={[
            styles.emptyTitle,
            {
              marginTop: css.spacing.md,
              fontFamily: css.typography.fontHeading,
              fontSize: css.typography.h3Size,
              color: css.palette.neutral900,
            },
          ]}
        >
          {t('userDashboard.empty.title')}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            {
              marginTop: css.spacing.xs,
              fontFamily: css.typography.fontBody,
              fontSize: css.typography.bodySize,
              color: css.palette.neutral500,
            },
          ]}
        >
          {t('userDashboard.empty.subtitle')}
        </Text>
        <TouchableOpacity
          style={[
            styles.emptyCtaButton,
            {
              marginTop: css.spacing.lg,
              backgroundColor: css.palette.primary800,
              paddingVertical: css.button.primaryPaddingV,
              paddingHorizontal: css.button.primaryPaddingH,
              borderRadius: css.radius.pill,
            },
          ]}
          onPress={() => navigation.navigate("AddRecipe")}
          accessibilityRole="button"
          accessibilityLabel={t('userDashboard.empty.addCtaA11y')}
        >
          <Text
            style={[
              styles.emptyCtaText,
              {
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.bodySize,
                color: css.palette.white,
              },
            ]}
          >
            {t('userDashboard.empty.addCta')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main render ───
  return (
    <View style={[styles.container, { backgroundColor: css.palette.surface }]}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={{ paddingBottom: tabBarHeight + css.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* ════ SECTION 1 — Personalized Header ════ */}
        <LinearGradient
          colors={css.gradient.hero.colors}
          locations={css.gradient.hero.locations}
          style={[
            styles.headerGradient,
            {
              paddingBottom: css.spacing.lg,
              paddingHorizontal: css.spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.greetingText,
              {
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h2Size,
                lineHeight: css.typography.h2Line,
                color: css.palette.white,
              },
            ]}
          >
            {greeting}, {user?.username || t('userDashboard.greeting.fallbackUsername')} {"👋"}
          </Text>
          <Text
            style={[
              styles.greetingSubtitle,
              {
                fontFamily: css.typography.fontBody,
                fontSize: css.typography.captionSize,
                color: css.palette.secondary200,
                marginTop: css.spacing.xs,
              },
            ]}
          >
            {t('userDashboard.greeting.subtitle')}
          </Text>
        </LinearGradient>

        {/* ════ SECTION 2 — Recently Viewed ════ */}
        {recentlyViewed.length > 0 && (
          <View
            style={[
              styles.sectionContainer,
              { marginTop: css.spacing.lg, paddingHorizontal: css.spacing.md },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontFamily: css.typography.fontHeading,
                  fontSize: css.typography.h3Size,
                  color: css.palette.neutral900,
                  marginBottom: css.spacing.md,
                },
              ]}
            >
              {t('userDashboard.recentlyViewed')}
            </Text>
            <FlatList
              data={recentlyViewed}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              contentContainerStyle={[
                styles.recentlyViewedScroll,
                { paddingRight: css.spacing.md, gap: css.spacing.cardGap },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.staffCard,
                    {
                      width: staffCardWidth,
                      height: staffCardHeight,
                      borderRadius: css.radius.card,
                      backgroundColor: css.palette.neutral200,
                    },
                  ]}
                  onPress={() => navigateToRecipe(item)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t('userDashboard.viewRecipeA11y', { name: item.name })}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.staffCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={css.gradient.imageOverlay.colors}
                    locations={css.gradient.imageOverlay.locations}
                    style={[
                      styles.staffCardOverlay,
                      {
                        paddingHorizontal: css.spacing.sm,
                        paddingBottom: css.spacing.sm,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.staffCardName,
                        {
                          fontFamily: css.typography.fontHeading,
                          fontSize: css.typography.h5Size,
                          color: css.palette.white,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <View style={[styles.starRow, { marginTop: css.spacing.xs }]}>
                      {renderStars(item.votes, 11, css)}
                    </View>
                  </LinearGradient>

                  {Array.isArray(item.origin) && item.origin.length > 0 ? (
                    <View
                      style={[
                        styles.originPill,
                        {
                          top: css.spacing.sm,
                          right: css.spacing.sm,
                          backgroundColor: css.pill.bgNeutral,
                          paddingVertical: css.card.tagPaddingV,
                          paddingHorizontal: css.card.tagPaddingH,
                          borderRadius: css.radius.pill,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.originPillText,
                          {
                            fontFamily: css.typography.fontUI,
                            fontSize: css.typography.overlineSize,
                            color: css.pill.textNeutral,
                            letterSpacing: css.typography.overlineSpacing,
                          },
                        ]}
                      >
                        {item.origin[0]}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ════ Persistent Search Bar ════ */}
        <View
          style={[
            styles.searchRow,
            {
              marginTop: css.spacing.lg,
              marginHorizontal: css.spacing.md,
              gap: css.spacing.sm,
            },
          ]}
        >
          <View
            style={[
              styles.searchBarContainer,
              {
                paddingHorizontal: css.spacing.md,
                paddingVertical: css.spacing.sm,
                backgroundColor: css.palette.surfaceCard,
                borderRadius: css.radius.pill,
              },
              css.shadow.sm,
            ]}
          >
            <FontAwesome
              name="search"
              size={16}
              color={css.palette.neutral500}
              style={[styles.searchBarIcon, { marginRight: css.spacing.sm }]}
            />
            <TextInput
              style={[
                styles.searchBarInput,
                {
                  fontFamily: css.typography.fontBody,
                  fontSize: css.typography.bodySize,
                  color: css.palette.neutral900,
                },
              ]}
              placeholder={t('userDashboard.searchPlaceholder')}
              placeholderTextColor={css.palette.neutral500}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              accessibilityLabel={t('userDashboard.searchPlaceholder')}
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filtersButton,
              { backgroundColor: css.palette.surfaceCard },
              css.shadow.sm,
              activeFiltersCount > 0 && { backgroundColor: css.palette.primary800 },
            ]}
            onPress={() => setFiltersModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t('userDashboard.filtersButton.a11y')}
          >
            <SlidersHorizontal
              size={20}
              color={activeFiltersCount > 0 ? css.palette.white : css.palette.neutral700}
            />
            {activeFiltersCount > 0 && (
              <View
                style={[
                  styles.filtersBadge,
                  {
                    backgroundColor: css.palette.error,
                    borderColor: css.palette.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filtersBadgeText,
                    {
                      color: css.palette.white,
                      fontFamily: css.typography.fontUI,
                    },
                  ]}
                >
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ════ SECTION 3 — Category Filter Bar ════ */}
        <View style={[styles.filterBarContainer, { marginTop: css.spacing.lg }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.filterBarScroll,
              { paddingHorizontal: css.spacing.md, gap: css.spacing.sm },
            ]}
          >
            {FILTERS.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    {
                      paddingVertical: css.spacing.sm,
                      paddingHorizontal: css.spacing.md,
                      borderRadius: css.radius.pill,
                      backgroundColor: isActive
                        ? css.pill.bgSelected
                        : css.pill.bgNeutral,
                    },
                  ]}
                  onPress={() => setActiveFilter(filter)}
                  accessibilityRole="button"
                  accessibilityLabel={t('userDashboard.filterA11y', { filter: t(`userDashboard.filters.${filter.toLowerCase()}`) })}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        fontFamily: css.typography.fontUI,
                        fontSize: css.typography.h5Size,
                        color: isActive ? css.pill.textSelected : css.pill.textNeutral,
                      },
                    ]}
                  >
                    {t(`userDashboard.filters.${filter.toLowerCase()}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ════ SECTION 4 — Community Favorites ════ */}
        <View
          style={[
            styles.sectionContainer,
            { marginTop: css.spacing.lg, paddingHorizontal: css.spacing.md },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h3Size,
                color: css.palette.neutral900,
                marginBottom: css.spacing.md,
              },
            ]}
          >
            {searchQuery.trim().length > 0
              ? t('userDashboard.searchResults')
              : t(`userDashboard.sectionTitles.${activeFilter.toLowerCase()}`)}
          </Text>

          {communityRecipes.length === 0 ? (
            <View style={[styles.filterEmptyContainer, { paddingVertical: css.spacing.xxl }]}>
              <Text
                style={[
                  styles.filterEmptyText,
                  {
                    fontFamily: css.typography.fontBody,
                    fontSize: css.typography.bodySize,
                    color: css.palette.neutral500,
                  },
                ]}
              >
                {t('userDashboard.emptyFilter')}
              </Text>
            </View>
          ) : (
            communityRecipes.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.communityCard,
                  {
                    backgroundColor: css.palette.surfaceCard,
                    borderRadius: css.radius.card,
                    marginBottom: css.spacing.cardGap,
                  },
                  css.shadow.card,
                ]}
                onPress={() => navigateToRecipe(item)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('userDashboard.viewRecipeA11y', { name: item.name })}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.communityCardImage}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.communityCardContent,
                    {
                      paddingVertical: css.spacing.sm,
                      paddingHorizontal: css.spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.communityCardName,
                      {
                        fontFamily: css.typography.fontHeading,
                        fontSize: css.typography.h4Size,
                        color: css.palette.neutral900,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <View style={[styles.communityCardMeta, { marginTop: css.spacing.xs }]}>
                    <Text
                      style={[
                        styles.metadataText,
                        {
                          fontFamily: css.typography.metadataFamily,
                          fontSize: css.typography.metadataSize,
                          color: css.typography.metadataColor,
                        },
                      ]}
                    >
                      {item.preparationTime ? `${item.preparationTime} ${t('userDashboard.meta.minutesShort')}` : "–"}
                    </Text>
                    <Text
                      style={[
                        styles.metadataDot,
                        {
                          fontFamily: css.typography.metadataFamily,
                          fontSize: css.typography.metadataSize,
                          color: css.typography.metadataColor,
                        },
                      ]}
                    >
                      {" · "}
                    </Text>
                    <Text
                      style={[
                        styles.metadataText,
                        {
                          fontFamily: css.typography.metadataFamily,
                          fontSize: css.typography.metadataSize,
                          color: css.typography.metadataColor,
                        },
                      ]}
                    >
                      {item.difficulty ? t('userDashboard.meta.difficulty', { value: item.difficulty }) : "–"}
                    </Text>
                  </View>
                  <View style={[styles.starRow, { marginTop: css.spacing.xs }]}>
                    {renderStars(item.votes, 13, css)}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      <FiltersModal
        visible={filtersModalVisible}
        onClose={() => setFiltersModalVisible(false)}
        requiredTags={requiredTags}
        excludedTags={excludedTags}
        setRequiredTags={setRequiredTags}
        setExcludedTags={setExcludedTags}
        requiredOrigins={requiredOrigins}
        excludedOrigins={excludedOrigins}
        setRequiredOrigins={setRequiredOrigins}
        setExcludedOrigins={setExcludedOrigins}
        availableOrigins={availableOrigins}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainScroll: {
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {},

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {},
  emptySubtitle: {
    textAlign: "center",
  },
  emptyCtaButton: {},
  emptyCtaText: {
    fontWeight: "600",
  },

  // Section 1 — Header
  headerGradient: {
    paddingTop: 60,
  },
  greetingText: {},
  greetingSubtitle: {},

  // Persistent Search Bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtersButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  filtersBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  searchBarIcon: {},
  searchBarInput: {
    flex: 1,
    paddingVertical: 0,
  },

  // Shared section
  sectionContainer: {},
  sectionTitle: {},

  // Section 2 — Recently Viewed
  recentlyViewedScroll: {},
  staffCard: {
    // width + height applied inline (responsive via useWindowDimensions)
    overflow: "hidden",
  },
  staffCardImage: {
    width: "100%",
    height: "100%",
  },
  staffCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
  },
  staffCardName: {},
  starRow: {
    flexDirection: "row",
    gap: 2,
  },
  originPill: {
    position: "absolute",
  },
  originPillText: {
    textTransform: "uppercase",
  },

  // Section 3 — Filter Bar
  filterBarContainer: {},
  filterBarScroll: {},
  filterChip: {},
  filterChipText: {
    fontWeight: "500",
  },

  // Section 4 — Community Favorites
  communityCard: {
    flexDirection: "row",
    height: COMMUNITY_CARD_HEIGHT,
    overflow: "hidden",
  },
  communityCardImage: {
    width: `${Math.round(COMMUNITY_IMAGE_WIDTH_RATIO * 100)}%`,
    height: "100%",
  },
  communityCardContent: {
    flex: 1,
    justifyContent: "center",
  },
  communityCardName: {},
  communityCardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metadataText: {},
  metadataDot: {},
  filterEmptyContainer: {
    alignItems: "center",
  },
  filterEmptyText: {},
});
