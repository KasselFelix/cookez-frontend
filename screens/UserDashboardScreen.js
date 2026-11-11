import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import CategoryFilterBar from "../components/dashboard/CategoryFilterBar";
import CommunityRecipeCard from "../components/dashboard/CommunityRecipeCard";
import DashboardSearchBar from "../components/dashboard/DashboardSearchBar";
import { DashboardEmpty, DashboardLoadError, DashboardLoading } from "../components/dashboard/DashboardStatus";
import RecentlyViewedSection from "../components/dashboard/RecentlyViewedSection";
import FiltersModal from "../components/FiltersModal";
import { useTheme } from "../contexts/ThemeProvider";
import useCatalogRecipes from "../hooks/useCatalogRecipes";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import useRecipeSearch from "../hooks/useRecipeSearch";
import useTabBarHeight from "../hooks/useTabBarHeight";
import useT from "../i18n/useT";
import { selectCommunityRecipes } from "../modules/dashboardFilters";
import { addRecipe } from "../reducers/recipe";

export default function UserDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);
  const t = useT();
  const css = useTheme();
  const tabBarHeight = useTabBarHeight();

  // The catalog has its own list in the slice: a ResultScreen search never
  // empties or replaces it (plan 017, point 1).
  const { recipes, isLoading, loadError, reload } = useCatalogRecipes();
  const recentlyViewed = useRecentlyViewed(user?.token);

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [requiredTags, setRequiredTags] = useState([]);
  const [excludedTags, setExcludedTags] = useState([]);
  const [requiredOrigins, setRequiredOrigins] = useState([]);
  const [excludedOrigins, setExcludedOrigins] = useState([]);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);

  const { isSearching, searchResults } = useRecipeSearch(searchQuery);

  const availableOrigins = useMemo(
    () => Array.from(new Set(recipes.flatMap((r) => r.origin ?? []))).sort(),
    [recipes]
  );

  const activeFiltersCount =
    requiredTags.length +
    excludedTags.length +
    requiredOrigins.length +
    excludedOrigins.length;

  const communityRecipes = useMemo(
    () =>
      selectCommunityRecipes(isSearching ? searchResults : recipes, {
        activeFilter,
        isSearching,
        requiredTags,
        excludedTags,
        requiredOrigins,
        excludedOrigins,
      }),
    [
      recipes,
      activeFilter,
      isSearching,
      searchResults,
      requiredTags,
      excludedTags,
      requiredOrigins,
      excludedOrigins,
    ]
  );

  const navigateToRecipe = useCallback(
    (recipe) => {
      // RecipeScreen reads votes and comments from Redux by _id: a recipe
      // found by the server search may not be in the table yet. addRecipe
      // stores it without adding it to the catalog list.
      const { matchRank, ...stored } = recipe;
      dispatch(addRecipe(stored));
      navigation.navigate("Recipe", { recipe });
    },
    [dispatch, navigation]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('userDashboard.greeting.morning');
    if (hour < 18) return t('userDashboard.greeting.afternoon');
    return t('userDashboard.greeting.evening');
  }, [t]);

  if (recipes.length === 0) {
    if (isLoading) return <DashboardLoading />;
    // Cache cold AND fetch failed.
    if (loadError) return <DashboardLoadError onRetry={reload} />;
    // Loaded, and the database really has no recipe.
    return <DashboardEmpty onAddRecipe={() => navigation.navigate("AddRecipe")} />;
  }

  return (
    <View testID="dashboard-screen" style={[styles.container, { backgroundColor: css.palette.surface }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: tabBarHeight + css.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
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
            style={{
              fontFamily: css.typography.fontHeading,
              fontSize: css.typography.h2Size,
              lineHeight: css.typography.h2Line,
              color: css.palette.white,
            }}
          >
            {greeting}, {user?.username || t('userDashboard.greeting.fallbackUsername')} {"👋"}
          </Text>
          <Text
            style={{
              fontFamily: css.typography.fontBody,
              fontSize: css.typography.captionSize,
              color: css.palette.secondary200,
              marginTop: css.spacing.xs,
            }}
          >
            {t('userDashboard.greeting.subtitle')}
          </Text>
        </LinearGradient>

        <RecentlyViewedSection recipes={recentlyViewed} onOpen={navigateToRecipe} />

        <DashboardSearchBar
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          activeFiltersCount={activeFiltersCount}
          onOpenFilters={() => setFiltersModalVisible(true)}
        />

        <CategoryFilterBar activeFilter={activeFilter} onSelect={setActiveFilter} />

        <View style={{ marginTop: css.spacing.lg, paddingHorizontal: css.spacing.md }}>
          <Text
            style={{
              fontFamily: css.typography.fontHeading,
              fontSize: css.typography.h3Size,
              color: css.palette.neutral900,
              marginBottom: css.spacing.md,
            }}
          >
            {isSearching
              ? t('userDashboard.searchResults')
              : t(`userDashboard.sectionTitles.${activeFilter.toLowerCase()}`)}
          </Text>

          {communityRecipes.length === 0 ? (
            <View style={[styles.filterEmpty, { paddingVertical: css.spacing.xxl }]}>
              <Text
                style={{
                  fontFamily: css.typography.fontBody,
                  fontSize: css.typography.bodySize,
                  color: css.palette.neutral500,
                }}
              >
                {t('userDashboard.emptyFilter')}
              </Text>
            </View>
          ) : (
            communityRecipes.map((item) => (
              <CommunityRecipeCard key={item._id} recipe={item} onOpen={navigateToRecipe} />
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
  headerGradient: {
    paddingTop: 60,
  },
  filterEmpty: {
    alignItems: "center",
  },
});
