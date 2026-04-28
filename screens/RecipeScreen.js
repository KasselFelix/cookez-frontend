import { FontAwesome } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
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
// COMPONENTS
import HeroImageParallax, { HERO_HEIGHT } from '../components/recipe/HeroImageParallax';
import StickyHeader from '../components/recipe/StickyHeader';
import ActionRow from '../components/recipe/ActionRow';
import CommentsSection from '../components/recipe/CommentsSection';
import CommentComposer from '../components/recipe/CommentComposer';
import FloatingFAB from '../components/recipe/FloatingFAB';

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
  const { recipe: navRecipe = {} } = route.params ?? {};
  const selectedRecipeId = navRecipe._id;

  // Always read recipe from Redux — guarantees comments stay in sync after add/vote
  const recipe = useSelector(
    (state) =>
      state.recipe.value.find((r) => r._id === selectedRecipeId) ?? navRecipe,
    shallowEqual
  );

  const user = useSelector((state) => state.user.value);
  const dispatch = useDispatch();

  // Local UI state — kept minimal
  const [popover, setPopover] = useState(null); // null | 'auth' | 'vote'
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [starNote, setStarNote] = useState(0);

  // Bottom sheet — controlled imperatively via ref
  const bottomSheetRef = useRef(null);
  const animatableModalRef = useRef(null);

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

  // Auto-close popover after 5.5s
  useEffect(() => {
    if (!popover) return;
    const t = setTimeout(() => setPopover(null), 5500);
    return () => clearTimeout(t);
  }, [popover]);

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
          if (animatableModalRef.current) {
            animatableModalRef.current
              .animate('slideOutUp', 800)
              .then(() => setVoteModalVisible(false));
          } else {
            setVoteModalVisible(false);
          }
        }
      } catch (err) {
        console.error('Vote failed', err);
      }
    },
    [user.token, user.username, selectedRecipeId, dispatch]
  );

  useEffect(() => {
    if (starNote > 0 && user.token) {
      handleFetchVote(starNote);
    }
  }, [starNote, user.token, handleFetchVote]);

  const handleVote = () => {
    if (user.token) setVoteModalVisible(true);
    else setPopover('vote');
  };

  // Favorite — Redux-source toggle
  const handleFavoriteToggle = useCallback(async () => {
    if (!user.token) {
      setPopover('auth');
      return;
    }
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
  }, [user.token, isFavorite, selectedRecipeId, recipe, dispatch]);

  // Composer
  const openComposer = useCallback(() => {
    if (!user.token) {
      setPopover('auth');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    bottomSheetRef.current?.snapToIndex(0);
  }, [user.token]);

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
            <Text style={styles.origin}>{recipe.origin}</Text>
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
            </View>

            <ActionRow
              isFavorite={isFavorite}
              onFavorite={handleFavoriteToggle}
              onVote={handleVote}
              onComment={openComposer}
              avgNote={avgNote}
              nbVotes={nbVotes}
            />

            {/* Description */}
            <Animatable.View animation="fadeInUp" duration={500} style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.body}>{recipe.description}</Text>
            </Animatable.View>

            {/* Ingredients */}
            <Animatable.View animation="fadeInUp" duration={550} style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {recipe.ingredients?.map((ing, i) => (
                <Text key={`${ing.name}-${i}`} style={styles.body}>
                  •  {ing.quantity}g {ing.name}
                </Text>
              ))}
            </Animatable.View>

            {/* Steps */}
            <Animatable.View animation="fadeInUp" duration={600} style={styles.section}>
              <Text style={styles.sectionTitle}>Steps</Text>
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

        {/* VOTE STAR MODAL */}
        <Modal visible={voteModalVisible} animationType="none" transparent>
          <View style={styles.modal}>
            <Animatable.View
              ref={animatableModalRef}
              animation="slideInDown"
              duration={500}
              style={styles.voteModalContainer}
            >
              <Text style={styles.voteModalTitle}>Rate this recipe</Text>
              <View style={styles.starsRow}>{starsVotes}</View>
            </Animatable.View>
          </View>
        </Modal>

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
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
