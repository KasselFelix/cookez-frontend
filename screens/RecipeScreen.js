import { FontAwesome } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { updateRecipeVote } from '../reducers/recipe';
import { toggleFavorite } from '../reducers/user';
// MODULES
import addressIp from '../modules/addressIp';
import imageRecipe from '../modules/images';
import css from '../styles/Global';
import useT from '../i18n/useT';
import { flagForOriginName } from '../modules/countries';
import { formatQuantity } from '../modules/units';
import { convertToBaseUnit } from '../modules/unitConversion';
// COMPONENTS
import { useAuthGate } from '../contexts/AuthGateProvider';
import HeroImageParallax, { HERO_HEIGHT } from '../components/recipe/HeroImageParallax';
import StickyHeader from '../components/recipe/StickyHeader';
import ActionRow from '../components/recipe/ActionRow';
import CommentsSection from '../components/recipe/CommentsSection';
import CommentComposer from '../components/recipe/CommentComposer';
import FloatingFAB from '../components/recipe/FloatingFAB';
import ServingsStepper from '../components/recipeFilters/ServingsStepper';
import NutritionPill from '../components/recipe/NutritionPill';
import NutritionSheet from '../components/recipe/NutritionSheet';
import ExpiryAlert from '../components/recipe/ExpiryAlert';
import ShoppingList from '../components/recipe/ShoppingList';
import SeasonalBadge from '../components/result/SeasonalBadge';

const NUTRITION_ORDER = ['calories', 'proteins', 'carbs', 'fat', 'fibers'];

const SNAP_POINTS = ['45%', '85%'];

/**
 * RecipeScreen — 2026 redesign
 * Single-source-of-truth: comments live in Redux (state.recipe.value[].comments).
 *
 * Architecture:
 *   <Animated.ScrollView>
 *     <HeroImageParallax />
 *     <ContentCard>
 *       <Meta /> <ActionRow /> <Sections /> <CommentsSection />
 *     </ContentCard>
 *   </Animated.ScrollView>
 *   <StickyHeader />              // glassmorphism, fades in on scroll
 *   <FloatingFAB />               // composer entry
 *   <BottomSheet>                 // gorhom v5
 *     <CommentComposer />
 *   </BottomSheet>
 */
export default function RecipeScreen({ route, navigation }) {
  const { recipe: navRecipe = {}, fromRecipeSearch = false } = route.params ?? {};
  const selectedRecipeId = navRecipe._id;

  // Always read recipe from Redux — guarantees comments stay in sync after add/vote
  const recipe = useSelector(
    (state) =>
      state.recipe.value.find((r) => r._id === selectedRecipeId) ?? navRecipe,
    shallowEqual
  );

  const user = useSelector((state) => state.user.value);
  // Pantry = inventory user entré depuis RecapScreen. Source de vérité
  // pour le possédé — utilisé par le memo shoppingList pour calculer la
  // différence (required - possessed) sans dépendre du snapshot backend.
  const pantry = useSelector((state) => state.ingredient.value, shallowEqual);
  const dispatch = useDispatch();
  const t = useT();
  const { requireAuth } = useAuthGate();

  useEffect(() => {
    if (!user?.token || !recipe?._id) return;
    fetch(`${addressIp}/users/lastViewed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token, recipeId: recipe._id }),
    }).catch(() => {});
  }, [user?.token, recipe?._id]);

  // Servings local au RecipeScreen — découplé de Redux pour ne PAS
  // déclencher de re-fetch côté ResultScreen (qui a currentServings dans
  // ses deps et remplacerait state.recipe.value en arrière-plan → la
  // recette courante disparaîtrait du store et tomberait sur navRecipe
  // sans les champs Plan 003). Cap à 999 (UX, pas de perf).
  //
  // Cascade de seed :
  //   1. fromRecipeSearch=true (entrée depuis ResultScreen) → `currentServings`
  //      de Redux (la stepper que l'user vient de régler sur RecapScreen)
  //   2. user loggué avec householdComposition > 0 → cette HH (compo de foyer)
  //   3. Fallback : `recipe.servings` (auteur) puis 1
  // Le seed est lu une seule fois (initializer de useState), donc les
  // changements futurs de Redux ne re-rendent pas ce screen.
  const userServings = useSelector(
    (state) => state.recipeFilters?.value?.currentServings ?? null
  );
  const householdComposition = useSelector(
    (state) => state.user?.value?.settings?.householdComposition ?? null
  );
  // Capture la source du seed initial — utilisé pour afficher le badge
  // "Ajusté pour votre foyer (×N)" quand le seed vient de HH. Source figée
  // au mount, ne change pas si l'user manipule la stepper ensuite.
  const [seedSource] = useState(() => {
    if (fromRecipeSearch && userServings) return 'search';
    const hh = Number(householdComposition);
    if (user?.token && hh > 0) return 'household';
    return 'recipe';
  });
  const [servings, setServings] = useState(() => {
    if (fromRecipeSearch && userServings) return userServings;
    const hh = Number(householdComposition);
    if (user?.token && hh > 0) return hh;
    return recipe.servings ?? 1;
  });

  // Local UI state — kept minimal
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [starNote, setStarNote] = useState(0);

  // Bottom sheet — controlled imperatively via ref
  const bottomSheetRef = useRef(null);
  const nutritionSheetRef = useRef(null);
  const animatableModalRef = useRef(null);

  // Vote backdrop fade — same pattern qu'la modal search de KickoffScreen.
  // Animated.Value RN classique (useNativeDriver pour opacity), 425ms.
  const voteBackdropOpacity = useRef(new RNAnimated.Value(0)).current;
  // Guard pour éviter que le seed du vote précédent (au ouverture de la
  // modal) re-déclenche le POST via le useEffect [starNote]. Bypass le
  // prochain fire et reset.
  const skipNextVoteFetch = useRef(false);

  // Fade in backdrop quand la modal s'ouvre.
  useEffect(() => {
    if (voteModalVisible) {
      voteBackdropOpacity.setValue(0);
      RNAnimated.timing(voteBackdropOpacity, {
        toValue: 1,
        duration: 425,
        useNativeDriver: true,
      }).start();
    }
  }, [voteModalVisible, voteBackdropOpacity]);

  // Fermeture commune : fade out backdrop + slideOutUp card, puis hide.
  const closeVoteModal = useCallback(() => {
    RNAnimated.timing(voteBackdropOpacity, {
      toValue: 0,
      duration: 425,
      useNativeDriver: true,
    }).start();
    if (animatableModalRef.current) {
      animatableModalRef.current
        .animate('slideOutUp', 425)
        .then(() => setVoteModalVisible(false));
    } else {
      setVoteModalVisible(false);
    }
  }, [voteBackdropOpacity]);

  const openNutritionSheet = useCallback(() => {
    nutritionSheetRef.current?.snapToIndex(0);
  }, []);

  // Derived recipe metrics
  const avgNote = useMemo(() => {
    if (!Array.isArray(recipe?.votes) || !recipe.votes.length) return 0;
    return recipe.votes.reduce((s, v) => s + (v.note ?? 0), 0) / recipe.votes.length;
  }, [recipe?.votes]);
  const nbVotes = recipe?.votes?.length ?? 0;
  const isFavorite = !!user.favorites?.some((fav) => fav._id === selectedRecipeId);

  // Scroll-driven shared value
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  // Vote — fire-and-forget API → updates Redux on success
  const handleFetchVote = useCallback(
    async (note) => {
      if (!user.token || !selectedRecipeId) return;
      try {
        const response = await fetch(
          `${addressIp}/recipes/vote/${selectedRecipeId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username, note }),
          }
        );
        const data = await response.json();
        if (data.result) {
          dispatch(
            updateRecipeVote({
              _id: selectedRecipeId,
              votes: data.votes,
            })
          );
          closeVoteModal();
        }
      } catch (err) {
        console.error('Vote failed', err);
      }
    },
    [user.token, user.username, selectedRecipeId, dispatch, closeVoteModal]
  );

  useEffect(() => {
    if (skipNextVoteFetch.current) {
      skipNextVoteFetch.current = false;
      return;
    }
    if (starNote > 0 && user.token) {
      handleFetchVote(starNote);
    }
  }, [starNote, user.token, handleFetchVote]);

  const handleVote = () => {
    if (!requireAuth('vote')) return;
    // Pré-remplit les étoiles avec le vote précédent de l'user pour cette
    // recette (si existant). Le schéma stocke `{ user: ObjectId, note }`,
    // donc on compare par ID (string) plutôt que par username. Le guard
    // `skipNextVoteFetch` évite que le seed re-déclenche un POST inutile
    // via le useEffect [starNote].
    const myId = user?._id ? String(user._id) : null;
    const previous = myId
      ? recipe?.votes?.find((v) => String(v.user) === myId)
      : null;
    const previousNote = previous?.note ?? 0;
    if (previousNote !== starNote) {
      skipNextVoteFetch.current = true;
      setStarNote(previousNote);
    }
    setVoteModalVisible(true);
  };

  // Favorite — Redux-source toggle
  const handleFavoriteToggle = useCallback(async () => {
    if (!requireAuth('favorite')) return;
    const action = isFavorite ? 'remove' : 'add';
    try {
      const response = await fetch(`${addressIp}/users/favorites/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ recipeId: selectedRecipeId }),
      });
      const data = await response.json();
      if (data.result) {
        dispatch(toggleFavorite(recipe));
      }
    } catch (err) {
      console.error('Favorite sync failed', err);
    }
  }, [requireAuth, user.token, isFavorite, selectedRecipeId, recipe, dispatch]);

  // Composer
  const openComposer = useCallback(() => {
    if (!requireAuth('comment')) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    bottomSheetRef.current?.snapToIndex(0);
  }, [requireAuth]);

  const closeComposer = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Guard: prevent rendering with no data
  if (!recipe?.name) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Recipe not found.</Text>
      </View>
    );
  }

  // Hero image source — local require if mapped, else Cloudinary URL
  const localHeroSource = recipe.picture && imageRecipe[`${recipe.picture}.jpg`];
  const heroUri = `https://res.cloudinary.com/dnym6kt4p/image/upload/${recipe.picture}.jpg`;

  // Scaling local — basé sur `servings` (state local), pas Redux.
  // Les ingrédients sont stockés à `recipe.servings` (default auteur).
  const servingsRatio =
    recipe.servings && recipe.servings > 0
      ? servings / recipe.servings
      : 1;
  const scaledIngredients = (recipe.ingredients || []).map((ing) => {
    const raw = (ing.quantity || 0) * servingsRatio;
    // Passe defaultUnit pour que `9 tsp farine` → `45g` (pas `45ml`).
    // Le defaultUnit de l'ingrédient dicte si c'est masse ou volume.
    const defaultUnit = ing.ingredient?.defaultUnit;
    const { value, unit } = formatQuantity(raw, ing.unit, defaultUnit);
    return { ...ing, displayQuantity: value, displayUnit: unit };
  });

  // Shopping list recalculée 100% client-side à partir de :
  //   - recipe.ingredients (populated avec ri.ingredient = Ingredient doc)
  //   - pantry (Redux state.ingredient.value — ce que l'utilisateur possède)
  //
  // Bénéfice : réagit instantanément au stepper local sans re-fetch, et
  // affiche correctement les items qui deviennent insuffisants quand le
  // nombre de portions augmente (le backend les filtre à la base, donc le
  // scaling proportionnel de missingIngredients n'aurait pas pu les
  // ressusciter).
  const shoppingList = useMemo(() => {
    if (!recipe?.ingredients?.length || !recipe?.servings) return [];
    const ratio = servings / recipe.servings;

    return recipe.ingredients
      .map((ri) => {
        const ingDoc = ri.ingredient;
        const ingId = ingDoc?._id || ingDoc;
        if (!ingId) return null;
        // NOTE : on n'exclut PAS les BASIC_INGREDIENTS (sucre/sel/farine/...)
        // de la shopping list. Le backend les ignore pour le matchRatio
        // (sinon presque tout serait flaggé manquant), mais l'utilisateur
        // peut quand même avoir besoin d'en acheter.

        const refW = ingDoc?.quantity || 1;
        const baseUnit = ingDoc?.defaultUnit || 'g';
        const requiredBase = convertToBaseUnit(ri.quantity, ri.unit, refW) * ratio;
        if (requiredBase <= 0) return null;

        // Possessed lookup par _id dans le pantry (data.* est le shape)
        const owned = pantry.find((p) => {
          const pid = p?.data?._id || p?._id;
          return pid && String(pid) === String(ingId);
        });
        const ownedQty = Number(owned?.data?.g_per_serving) || 0;
        const ownedUnit = owned?.data?.unit || owned?.data?.defaultUnit || baseUnit;
        const possessedBase = owned
          ? convertToBaseUnit(ownedQty, ownedUnit, refW)
          : 0;

        const missingBase = Math.max(0, requiredBase - possessedBase);
        if (missingBase <= 0) return null;

        const percentOwned = Math.min(
          100,
          Math.round((possessedBase / requiredBase) * 100)
        );
        const isUnitBased = ri.unit === 'unit';

        return {
          name: ri.name,
          // Plancher à 1 : missingBase > 0 mais < 0.5 produirait "0g" avec
          // Math.round (cas typique : scaling factor petit sur petite qté).
          // isUnitBased utilise déjà Math.ceil → garanti ≥ 1.
          quantityMissing: isUnitBased
            ? Math.ceil(missingBase / refW)
            : Math.max(1, Math.round(missingBase)),
          unit: isUnitBased ? 'units' : baseUnit,
          percentOwned,
        };
      })
      .filter(Boolean);
  }, [recipe, servings, pantry]);

  // Pinned iteration order (backend may not freeze object key order)
  const orderedNutrition = recipe.nutritionPerServing
    ? Object.fromEntries(
        NUTRITION_ORDER.filter(
          (k) => recipe.nutritionPerServing[k] != null
        ).map((k) => [k, recipe.nutritionPerServing[k]])
      )
    : null;

  const onServingsIncrement = () => setServings((s) => Math.min(s + 1, 999));
  const onServingsDecrement = () => setServings((s) => Math.max(s - 1, 1));

  // Star vote modal display
  const starsVotes = [];
  for (let i = 0; i < 5; i++) {
    starsVotes.push(
      <TouchableOpacity
        key={i}
        onPress={() => setStarNote(i + 1)}
        accessibilityRole="button"
        accessibilityLabel={`Rate ${i + 1} out of 5`}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FontAwesome
          name="star"
          size={36}
          color={i < starNote ? css.palette.primary500 : css.palette.neutral300}
          style={styles.voteStar}
        />
      </TouchableOpacity>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <HeroImageParallax
            scrollY={scrollY}
            uri={heroUri}
            localSource={localHeroSource}
          />

          <View style={styles.contentCard}>
            {/* Meta */}
            <Text style={styles.origin}>
              {(Array.isArray(recipe.origin) ? recipe.origin : recipe.origin ? [recipe.origin] : [])
                .map((name) => `${flagForOriginName(name)} ${name}`)
                .join(' · ')}
            </Text>
            <Text style={styles.title}>{recipe.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <FontAwesome
                  name="clock-o"
                  size={14}
                  color={css.palette.primary800}
                />
                <Text style={styles.metaPillText}>
                  {recipe.preparationTime} min
                </Text>
              </View>
              <View style={styles.metaPill}>
                <FontAwesome
                  name="signal"
                  size={14}
                  color={css.palette.primary800}
                />
                <Text style={styles.metaPillText}>
                  Difficulty {recipe.difficulty}/5
                </Text>
              </View>
              <NutritionPill
                caloriesPerServing={orderedNutrition?.calories}
                onPress={openNutritionSheet}
              />
              {recipe.isSeasonal && <SeasonalBadge />}
            </View>

            <ActionRow
              isFavorite={isFavorite}
              onFavorite={handleFavoriteToggle}
              onVote={handleVote}
              onComment={openComposer}
              avgNote={avgNote}
              nbVotes={nbVotes}
            />

            {/* Expiry alert — surfaces ingredients about to expire */}
            <ExpiryAlert ingredients={recipe.expiringIngredients || []} />

            {/* Description */}
            <Animatable.View animation="fadeInUp" duration={500} style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.body}>{recipe.description}</Text>
            </Animatable.View>

            {/* Ingredients — header inclut le stepper de servings :
                ajuster les portions met à jour les quantités directement
                dans la même card (feedback visuel immédiat). */}
            <Animatable.View animation="fadeInUp" duration={550} style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleInline}>Ingredients</Text>
                <ServingsStepper
                  value={servings}
                  max={999}
                  onIncrement={onServingsIncrement}
                  onDecrement={onServingsDecrement}
                />
              </View>
              {seedSource === 'household' && (
                <Text style={styles.householdBadge}>
                  {t('recipe.servings.adjustedForHousehold', { count: servings })}
                </Text>
              )}
              {scaledIngredients.map((ing, i) => (
                <Text key={`${ing.name}-${i}`} style={styles.body}>
                  •  {ing.displayQuantity}{ing.displayUnit} {ing.name}
                </Text>
              ))}
            </Animatable.View>

            {/* Shopping list — Amazon CTAs for missing ingredients */}
            <ShoppingList items={shoppingList} />

            {/* Steps */}
            <Animatable.View animation="fadeInUp" duration={600} style={styles.section}>
              <Text style={styles.sectionTitle}>{t('recipe.steps.title')}</Text>
              {recipe.steps?.map((text, i) => (
                <Text key={`step-${i}`} style={styles.body}>
                  {i + 1}. {text}
                </Text>
              ))}
            </Animatable.View>

            {/* Comments — Redux source of truth */}
            <CommentsSection
              recipeId={selectedRecipeId}
              onPromptCompose={openComposer}
            />
          </View>
        </Animated.ScrollView>

        <StickyHeader
          scrollY={scrollY}
          title={recipe.name}
          onBack={() => navigation.goBack()}
          onHome={
            user.token
              ? () =>
                  navigation.navigate('TabNavigator', { screen: 'UserDashboard' })
              : () => navigation.navigate('Home')
          }
        />

        <FloatingFAB onPress={openComposer} />

        {/* VOTE STAR MODAL — backdrop animée + tap-to-dismiss */}
        <Modal
          visible={voteModalVisible}
          animationType="none"
          transparent
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={closeVoteModal}
        >
          {/* Backdrop fade-in/out indépendant du slide de la card. */}
          <RNAnimated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.modalBackdrop,
              { opacity: voteBackdropOpacity },
            ]}
            pointerEvents="none"
          />
          <Pressable
            style={styles.modalCenter}
            onPress={closeVoteModal}
            accessibilityLabel={t('common.close')}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animatable.View
                ref={animatableModalRef}
                animation="slideInDown"
                duration={500}
                style={styles.voteModalContainer}
              >
                <Text style={styles.voteModalTitle}>Rate this recipe</Text>
                <View style={styles.starsRow}>{starsVotes}</View>
              </Animatable.View>
            </Pressable>
          </Pressable>
        </Modal>

        <NutritionSheet
          ref={nutritionSheetRef}
          nutritionPerServing={orderedNutrition}
        />

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={SNAP_POINTS}
          enablePanDownToClose
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <CommentComposer recipeId={selectedRecipeId} onClose={closeComposer} />
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: css.palette.background,
  },
  scrollContent: {
    paddingBottom: css.spacing.xxxl + css.spacing.xxl,
  },
  contentCard: {
    marginTop: -css.spacing.xl,
    backgroundColor: css.palette.background,
    borderTopLeftRadius: css.radius.card,
    borderTopRightRadius: css.radius.card,
    paddingHorizontal: css.spacing.md,
    paddingTop: css.spacing.lg,
  },
  origin: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.overlineSize,
    letterSpacing: css.typography.overlineSpacing,
    color: css.palette.primary600,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: css.typography.fontDisplay,
    fontSize: css.typography.h1Size,
    lineHeight: css.typography.h1Line,
    color: css.palette.neutral900,
    marginTop: css.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: css.spacing.sm,
    marginTop: css.spacing.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: css.spacing.xs,
    paddingVertical: css.spacing.xs,
    paddingHorizontal: css.spacing.sm,
    borderRadius: css.radius.pill,
    backgroundColor: css.palette.secondary200,
  },
  metaPillText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.captionSize,
    color: css.palette.primary800,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: css.spacing.sm,
    gap: css.spacing.sm,
  },
  sectionTitleInline: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
  },
  householdBadge: {
    fontFamily: css.typography.fontUI,
    fontSize: 12,
    fontStyle: 'italic',
    color: css.palette.primary700,
    marginBottom: css.spacing.sm,
  },
  section: {
    marginTop: css.spacing.lg,
    backgroundColor: css.palette.surfaceCard,
    padding: css.spacing.md,
    borderRadius: css.radius.lg,
    ...css.shadow.sm,
  },
  sectionTitle: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
    marginBottom: css.spacing.sm,
  },
  body: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    lineHeight: css.typography.bodyLine,
    color: css.palette.neutral700,
    marginBottom: css.spacing.xs,
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    backgroundColor: css.palette.overlayDark,
  },
  voteModalContainer: {
    width: '85%',
    backgroundColor: css.palette.surfaceCard,
    borderRadius: css.radius.lg,
    padding: css.spacing.lg,
    alignItems: 'center',
    ...css.shadow.lg,
  },
  voteModalTitle: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
    marginBottom: css.spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: css.spacing.xs,
  },
  voteStar: {
    marginHorizontal: css.spacing.xs,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: css.palette.background,
  },
  fallbackText: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    color: css.palette.neutral700,
  },
  sheetBg: {
    backgroundColor: css.palette.surfaceCard,
    borderTopLeftRadius: css.radius.card,
    borderTopRightRadius: css.radius.card,
  },
  sheetHandle: {
    backgroundColor: css.palette.neutral300,
    width: 48,
  },
});
