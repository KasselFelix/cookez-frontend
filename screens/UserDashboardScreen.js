import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
//import * as Unicons from "@iconscout/react-native-unicons";

import ListRecipes from "../components/ListRecipes";
import SearchRecipe from "../components/SearchRecipe";
import addressIp from "../modules/addressIp";
import css from "../styles/Global";
import { setRecipes } from "../reducers/recipe";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STAFF_CARD_WIDTH = 160;
const STAFF_CARD_HEIGHT = 213;
const COMMUNITY_CARD_HEIGHT = 100;
const COMMUNITY_IMAGE_WIDTH_RATIO = 0.35;

const FILTERS = ["All", "Quick", "Vegan", "Dessert", "Trending"];

// ─────────────────────────────────────────────
// Pure helpers (outside component — stable refs)
// ─────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function renderStars(votes, size = 13) {
  // const rounded = Math.floor(avgNote || 0);
  // return Array.from({ length: 5 }, (_, i) => (
  //   <FontAwesome
  //     key={i}
  //     name="star"
  //     size={size}
  //     color={i < rounded ? css.palette.warning : css.palette.neutral300}
  //   />
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
    case "Quick":    return recipes.filter((r) => r.preparationTime <= 20);
    case "Vegan":    return recipes.filter((r) => r.origin?.toLowerCase() === "vegan");
    case "Dessert":  return recipes.filter((r) => r.origin?.toLowerCase() === "dessert");
    case "Trending": return recipes.filter((r) => (r.votes?.length || 0) >= 3);
    default:         return recipes;
  }
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function UserDashboardScreen({ navigation }) {
  const user = useSelector((state) => state.user.value);
  const recipes = useSelector((state) => state.recipe.value);
  
  //const [recipes, setRecipes]               = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [activeFilter, setActiveFilter]     = useState("All");
  const [modalVisible, setModalVisible]     = useState(false);
  const [searchRecipe, setSearchRecipe]     = useState("");
  const [clicked, setClicked]               = useState(false);
  const [dataListRecipe, setDataListRecipe] = useState([]);

  // Derived lists — memoized to avoid re-sorting on every render
  const staffPicks = useMemo(
    () =>
      [...recipes]
        .filter((r) => (r.avgNote || 0) > 0)
        .sort((a, b) => (b.avgNote || 0) - (a.avgNote || 0))
        .slice(0, 8),
    [recipes]
  );

  const communityRecipes = useMemo(
    () => applyFilter([...recipes].reverse(), activeFilter).slice(0, 15),
    [recipes, activeFilter]
  );

  // ── Search ──
  const handleFetchRecipe = useCallback(async () => {
    if (!searchRecipe.trim()) return;
    try {
      const response = await fetch(`${addressIp}/recipes/recipeName`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchRecipe }),
      });
      const data = await response.json();
      setDataListRecipe(data.result ? data.recipe : []);
    } catch (error) {
      console.error("handleFetchRecipe:", error.message);
      setDataListRecipe([]);
    }
  }, [searchRecipe]);

  // Run search when query changes
  useFocusEffect(
    useCallback(() => {
      if (searchRecipe.length > 0) handleFetchRecipe();
    }, [searchRecipe, handleFetchRecipe])
  );

  // ── Navigate to recipe + persist lastViewed ──
  const navigateToRecipe = useCallback(
    (recipe) => {
      navigation.navigate("Recipe", { recipe });
      if (user?.token) {
        fetch(`${addressIp}/users/lastViewed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: user.token, recipeId: recipe._id }),
        }).catch(() => {}); // fire-and-forget — must not block navigation
      }
    },
    [navigation, user]
  );

  const onItemPress = useCallback(
    (recipe) => {
      setModalVisible(false);
      setSearchRecipe("");
      setDataListRecipe([]);
      navigation.navigate("Recipe", { recipe });
    },
    [navigation]
  );

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSearchRecipe("");
    setDataListRecipe([]);
  }, []);

  const greeting = getGreeting();

  // ─── Loading state ───
  if (isLoading && recipes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={css.palette.primary500}
          accessibilityLabel="Loading recipes"
        />
        <Text style={styles.loadingText}>Loading recipes…</Text>
      </View>
    );
  }

  // ─── Empty state ───
  if (!isLoading && recipes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="cutlery" size={48} color={css.palette.neutral300} />
        <Text style={styles.emptyTitle}>No recipes yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to add one!</Text>
        <TouchableOpacity
          style={styles.emptyCtaButton}
          onPress={() => navigation.navigate("AddRecipe")}
          accessibilityRole="button"
          accessibilityLabel="Add a recipe"
        >
          <Text style={styles.emptyCtaText}>Add Recipe</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main render ───
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ════ SECTION 1 — Personalized Header ════ */}
        <LinearGradient
          colors={css.gradient.hero.colors}
          locations={css.gradient.hero.locations}
          style={styles.headerGradient}
        >
          <Text style={styles.greetingText}>
            {greeting}, {user?.username || "Chef"} {"👋"}
          </Text>
          <Text style={styles.greetingSubtitle}>
            What are we cooking today?
          </Text>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionChip}
              onPress={() => navigation.navigate("Kickoff")}
              accessibilityRole="button"
              accessibilityLabel="Scan ingredients"
            >
              {/* <Unicons.UilCameraPlus size={18} color={css.palette.primary800} /> */}
              <Text style={styles.quickActionText}>Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionChip}
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Search recipes"
            >
              {/* <Unicons.UilSearch size={18} color={css.palette.primary800} /> */}
              <Text style={styles.quickActionText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionChip}
              onPress={() => navigation.navigate("Favorite")}
              accessibilityRole="button"
              accessibilityLabel="View favorites"
            >
              <FontAwesome name="heart" size={16} color={css.palette.favorite} />
              <Text style={styles.quickActionText}>Favorites</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ════ SECTION 2 — Staff Picks ════ */}
        {staffPicks.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Staff Picks</Text>
            <FlatList
              data={staffPicks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.staffPicksScroll}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.staffCard}
                  onPress={() => navigateToRecipe(item)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`View recipe: ${item.name}`}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.staffCardImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={css.gradient.staffPicks.colors}
                    locations={css.gradient.staffPicks.locations}
                    style={styles.staffCardOverlay}
                  >
                    <Text style={styles.staffCardName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={styles.starRow}>
                      {renderStars(item.votes, 11)}
                    </View>
                  </LinearGradient>

                  {item.origin ? (
                    <View style={styles.originPill}>
                      <Text style={styles.originPillText}>{item.origin}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ════ SECTION 3 — Category Filter Bar ════ */}
        <View style={styles.filterBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBarScroll}
          >
            {FILTERS.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                  onPress={() => setActiveFilter(filter)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter: ${filter}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ════ SECTION 4 — Community Favorites ════ */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Community Favorites</Text>

          {communityRecipes.length === 0 ? (
            <View style={styles.filterEmptyContainer}>
              <Text style={styles.filterEmptyText}>No recipes match this filter.</Text>
            </View>
          ) : (
            communityRecipes.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.communityCard}
                onPress={() => navigateToRecipe(item)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`View recipe: ${item.name}`}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.communityCardImage}
                  resizeMode="cover"
                />
                <View style={styles.communityCardContent}>
                  <Text style={styles.communityCardName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.communityCardMeta}>
                    <Text style={styles.metadataText}>
                      {item.preparationTime ? `${item.preparationTime} min` : "–"}
                    </Text>
                    <Text style={styles.metadataDot}> · </Text>
                    <Text style={styles.metadataText}>
                      {item.difficulty ? `Difficulty ${item.difficulty}/5` : "–"}
                    </Text>
                  </View>
                  <View style={styles.starRow}>
                    {renderStars(item.votes, 13)}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: css.spacing.xxl }} />
      </ScrollView>

      {/* ════ SECTION 5 — Search Bottom Sheet ════ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragHandle} />

            <SearchRecipe
              searchRecipe={searchRecipe}
              setSearchRecipe={setSearchRecipe}
              setDataListRecipe={setDataListRecipe}
              clicked={clicked}
              setClicked={setClicked}
            />

            <ListRecipes
              searchRecipe={searchRecipe}
              data={dataListRecipe}
              setClicked={setClicked}
              onItemPress={onItemPress}
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: css.palette.surface,
  },
  mainScroll: {
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: css.palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: css.spacing.md,
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    color: css.palette.neutral500,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    backgroundColor: css.palette.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: css.spacing.xl,
  },
  emptyTitle: {
    marginTop: css.spacing.md,
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
  },
  emptySubtitle: {
    marginTop: css.spacing.xs,
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    color: css.palette.neutral500,
    textAlign: "center",
  },
  emptyCtaButton: {
    marginTop: css.spacing.lg,
    backgroundColor: css.palette.primary800,
    paddingVertical: css.button.primaryPaddingV,
    paddingHorizontal: css.button.primaryPaddingH,
    borderRadius: css.radius.pill,
  },
  emptyCtaText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.bodySize,
    fontWeight: "600",
    color: css.palette.white,
  },

  // Section 1 — Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: css.spacing.lg,
    paddingHorizontal: css.spacing.md,
  },
  greetingText: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h2Size,
    lineHeight: css.typography.h2Line,
    color: css.palette.white,
  },
  greetingSubtitle: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.captionSize,
    color: css.palette.secondary200,
    marginTop: css.spacing.xs,
  },
  quickActionsRow: {
    flexDirection: "row",
    marginTop: css.spacing.md,
    gap: css.spacing.sm,
  },
  quickActionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: css.palette.secondary200,
    paddingVertical: css.spacing.sm,
    paddingHorizontal: css.spacing.md,
    borderRadius: css.radius.pill,
    gap: css.spacing.xs,
  },
  quickActionText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.h5Size,
    color: css.palette.primary800,
    fontWeight: "500",
  },

  // Shared section
  sectionContainer: {
    marginTop: css.spacing.lg,
    paddingHorizontal: css.spacing.md,
  },
  sectionTitle: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
    marginBottom: css.spacing.md,
  },

  // Section 2 — Staff Picks
  staffPicksScroll: {
    paddingRight: css.spacing.md,
    gap: css.spacing.cardGap,
  },
  staffCard: {
    width: STAFF_CARD_WIDTH,
    height: STAFF_CARD_HEIGHT,
    borderRadius: css.radius.card,
    overflow: "hidden",
    backgroundColor: css.palette.neutral200,
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
    paddingHorizontal: css.spacing.sm,
    paddingBottom: css.spacing.sm,
  },
  staffCardName: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h5Size,
    color: css.palette.white,
  },
  starRow: {
    flexDirection: "row",
    marginTop: css.spacing.xs,
    gap: 2,
  },
  originPill: {
    position: "absolute",
    top: css.spacing.sm,
    right: css.spacing.sm,
    backgroundColor: css.palette.secondary200,
    paddingVertical: css.card.tagPaddingV,
    paddingHorizontal: css.card.tagPaddingH,
    borderRadius: css.radius.pill,
  },
  originPillText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.overlineSize,
    color: css.palette.primary800,
    textTransform: "uppercase",
    letterSpacing: css.typography.overlineSpacing,
  },

  // Section 3 — Filter Bar
  filterBarContainer: {
    marginTop: css.spacing.lg,
  },
  filterBarScroll: {
    paddingHorizontal: css.spacing.md,
    gap: css.spacing.sm,
  },
  filterChip: {
    paddingVertical: css.spacing.sm,
    paddingHorizontal: css.spacing.md,
    borderRadius: css.radius.pill,
  },
  filterChipActive:   { backgroundColor: css.palette.primary800 },
  filterChipInactive: { backgroundColor: css.palette.secondary200 },
  filterChipText:     { fontFamily: css.typography.fontUI, fontSize: css.typography.h5Size, fontWeight: "500" },
  filterChipTextActive:   { color: css.palette.white },
  filterChipTextInactive: { color: css.palette.primary800 },

  // Section 4 — Community Favorites
  communityCard: {
    flexDirection: "row",
    height: COMMUNITY_CARD_HEIGHT,
    backgroundColor: css.palette.surfaceCard,
    borderRadius: css.radius.card,
    overflow: "hidden",
    marginBottom: css.spacing.cardGap,
    ...css.shadow.card,
  },
  communityCardImage: {
    width: `${Math.round(COMMUNITY_IMAGE_WIDTH_RATIO * 100)}%`,
    height: "100%",
  },
  communityCardContent: {
    flex: 1,
    paddingVertical: css.spacing.sm,
    paddingHorizontal: css.spacing.md,
    justifyContent: "center",
  },
  communityCardName: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h4Size,
    color: css.palette.neutral900,
  },
  communityCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: css.spacing.xs,
  },
  metadataText: {
    fontFamily: css.typography.metadataFamily,
    fontSize: css.typography.metadataSize,
    color: css.typography.metadataColor,
  },
  metadataDot: {
    fontFamily: css.typography.metadataFamily,
    fontSize: css.typography.metadataSize,
    color: css.typography.metadataColor,
  },
  filterEmptyContainer: {
    alignItems: "center",
    paddingVertical: css.spacing.xxl,
  },
  filterEmptyText: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    color: css.palette.neutral500,
  },

  // Section 5 — Search Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: css.palette.overlayDark,
  },
  modalSheet: {
    backgroundColor: css.palette.surface,
    borderTopLeftRadius: css.radius.xl,
    borderTopRightRadius: css.radius.xl,
    paddingTop: css.spacing.sm,
    paddingBottom: css.spacing.xxl,
    paddingHorizontal: css.spacing.md,
    minHeight: "55%",
    maxHeight: "85%",
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: css.palette.neutral300,
    alignSelf: "center",
    marginBottom: css.spacing.md,
  },
  modalCloseButton: {
    marginTop: css.spacing.md,
    backgroundColor: css.palette.primary800,
    paddingVertical: css.button.smPaddingV,
    paddingHorizontal: css.button.smPaddingH,
    borderRadius: css.radius.pill,
  },
  modalCloseText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.button.smFontSize,
    fontWeight: "600",
    color: css.palette.white,
  },
});
