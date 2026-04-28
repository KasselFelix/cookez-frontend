import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import addressIp from '../modules/addressIp';
import css from '../styles/Global';
import UserCommentCard from '../components/recipe/UserCommentCard';
import {
  deleteComment as deleteCommentAction,
  updateCommentMessage as updateCommentMessageAction,
} from '../reducers/recipe';

const SORT_RECENT = 'recent';
const SORT_LIKED = 'liked';
const MAX_MESSAGE_LENGTH = 500;
const SKELETON_COUNT = 4;

/**
 * CommentScreen — "Contribution Hub"
 * ----------------------------------
 * Lists every comment authored by the current user, with:
 *   - Hero stats banner ("X reviews / Y likes earned")
 *   - Sort pills (Most Recent / Most Liked)
 *   - Swipe-to-Edit/Delete on each row (UserCommentCard)
 *   - Edit modal pre-filled with the current message (max 500 chars)
 *   - Skeleton loader for the initial fetch
 *   - Empty state for new users
 */
export default function CommentScreen({ navigation }) {
  const user = useSelector((state) => state.user.value);
  const recipesInStore = useSelector((state) => state.recipe.value);
  const dispatch = useDispatch();

  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ totalComments: 0, totalLikesReceived: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState(SORT_RECENT);

  // Edit modal state
  const [editing, setEditing] = useState(null);          // the comment being edited
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Deduplicated cache of recipe lookups for the JSX render path.
  const recipesById = useMemo(() => {
    const map = new Map();
    for (const r of recipesInStore || []) {
      if (r?._id) map.set(String(r._id), r);
    }
    return map;
  }, [recipesInStore]);

  const fetchComments = useCallback(async () => {
    if (!user?.username) {
      setComments([]);
      setStats({ totalComments: 0, totalLikesReceived: 0 });
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await fetch(`${addressIp}/comments/${user.username}`);
      const data = await res.json();
      if (data.result) {
        setComments(Array.isArray(data.commentsByAuthor) ? data.commentsByAuthor : []);
        setStats(
          data.stats || { totalComments: 0, totalLikesReceived: 0 }
        );
      } else {
        setError(data.error || 'Could not load your comments.');
      }
    } catch (err) {
      console.error('CommentScreen fetch failed', err);
      setError('Network error. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    setLoading(true);
    fetchComments();
  }, [fetchComments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComments();
    setRefreshing(false);
  }, [fetchComments]);

  // Sort the list before rendering. Memoised so we don't re-sort on every render.
  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sort === SORT_LIKED) {
      list.sort((a, b) => (b?.up?.length ?? 0) - (a?.up?.length ?? 0));
    } else {
      list.sort((a, b) => {
        const da = a?.date ? new Date(a.date).getTime() : 0;
        const db = b?.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
    }
    return list;
  }, [comments, sort]);

  const handleOpenRecipe = useCallback(
    (comment) => {
      const recipeId = comment?.recipe?._id;
      // Prefer the full recipe object from the Redux cache (boots from /recipes/all).
      // Falls back to the partial `comment.recipe` so RecipeScreen's
      // `if (!recipe?.name)` guard can show its empty state if needed.
      const fullRecipe = recipeId ? recipesById.get(String(recipeId)) : null;
      const recipe = fullRecipe || comment?.recipe || {};
      navigation.navigate('Recipe', { recipe });
    },
    [navigation, recipesById]
  );

  const handleStartEdit = useCallback((comment) => {
    setEditing(comment);
    setEditDraft(comment?.message ?? '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditing(null);
    setEditDraft('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editing?._id) return;
    const trimmed = editDraft.trim();
    if (!trimmed) {
      Alert.alert('Empty message', 'Your review can\'t be empty.');
      return;
    }
    if (trimmed === editing.message) {
      handleCancelEdit();
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(
        `${addressIp}/comments/update/${editing._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, message: trimmed }),
        }
      );
      const data = await res.json();
      if (data.result) {
        // Local list (this screen's state)
        setComments((prev) =>
          prev.map((c) =>
            c._id === editing._id
              ? { ...c, message: data.comment?.message ?? trimmed }
              : c
          )
        );
        // Redux (so RecipeScreen reflects the change)
        dispatch(
          updateCommentMessageAction({
            recipeId: editing.recipe?._id,
            commentId: editing._id,
            message: data.comment?.message ?? trimmed,
          })
        );
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
        handleCancelEdit();
      } else {
        Alert.alert('Update failed', data.error || 'Try again later.');
      }
    } catch (err) {
      console.error('Edit comment failed', err);
      Alert.alert('Network error', 'Could not save your changes.');
    } finally {
      setSavingEdit(false);
    }
  }, [editing, editDraft, user?.username, dispatch, handleCancelEdit]);

  const performDelete = useCallback(
    async (comment) => {
      if (!comment?._id) return;
      try {
        const res = await fetch(
          `${addressIp}/comments/delete/${comment._id}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username }),
          }
        );
        const data = await res.json();
        if (data.result) {
          // Optimistic local removal
          setComments((prev) => prev.filter((c) => c._id !== comment._id));
          setStats((prev) => ({
            totalComments: Math.max(0, (prev.totalComments ?? 0) - 1),
            totalLikesReceived: Math.max(
              0,
              (prev.totalLikesReceived ?? 0) - (comment.up?.length ?? 0)
            ),
          }));
          dispatch(
            deleteCommentAction({
              recipeId: comment.recipe?._id,
              commentId: comment._id,
            })
          );
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {});
        } else {
          Alert.alert('Delete failed', data.error || 'Try again later.');
        }
      } catch (err) {
        console.error('Delete comment failed', err);
        Alert.alert('Network error', 'Could not delete the comment.');
      }
    },
    [user?.username, dispatch]
  );

  const handleRequestDelete = useCallback(
    (comment) => {
      Alert.alert(
        'Delete review?',
        'This will permanently remove your review from the recipe.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => performDelete(comment),
          },
        ]
      );
    },
    [performDelete]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <UserCommentCard
        comment={item}
        onPress={() => handleOpenRecipe(item)}
        onEdit={() => handleStartEdit(item)}
        onDelete={() => handleRequestDelete(item)}
      />
    ),
    [handleOpenRecipe, handleStartEdit, handleRequestDelete]
  );

  const keyExtractor = useCallback(
    (item, i) => (item?._id ? String(item._id) : `fallback-${i}`),
    []
  );

  return (
    <View style={styles.root}>
      {/* HERO BANNER ----------------------------------------------- */}
      <LinearGradient
        colors={css.gradient.hero.colors}
        locations={css.gradient.hero.locations}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome
              name="angle-left"
              size={28}
              color={css.palette.white}
            />
          </TouchableOpacity>
          <Text style={styles.heroEyebrow}>Contribution Hub</Text>
          <View style={styles.backButton} />
        </View>
        <Text style={styles.heroTitle}>
          You shared {stats.totalComments ?? 0}{' '}
          {stats.totalComments === 1 ? 'review' : 'reviews'}
        </Text>
        <Text style={styles.heroSubtitle}>
          and earned {stats.totalLikesReceived ?? 0}{' '}
          {stats.totalLikesReceived === 1 ? 'like' : 'likes'} from the community
        </Text>
      </LinearGradient>

      {/* SORT PILLS ------------------------------------------------ */}
      <View style={styles.sortRow}>
        <SortPill
          label="Most Recent"
          active={sort === SORT_RECENT}
          onPress={() => setSort(SORT_RECENT)}
        />
        <SortPill
          label="Most Liked"
          active={sort === SORT_LIKED}
          onPress={() => setSort(SORT_LIKED)}
        />
      </View>

      {/* LIST / STATES --------------------------------------------- */}
      {loading ? (
        <SkeletonList />
      ) : error ? (
        <View style={styles.centeredState}>
          <FontAwesome
            name="exclamation-circle"
            size={32}
            color={css.palette.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              fetchComments();
            }}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Retry loading comments"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sortedComments.length === 0 ? (
        <EmptyState onCta={() => navigation.navigate('UserDashboard')} />
      ) : (
        <FlatList
          data={sortedComments}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={css.palette.primary500}
            />
          }
          initialNumToRender={8}
          windowSize={9}
          removeClippedSubviews
        />
      )}

      {/* EDIT MODAL ------------------------------------------------ */}
      <Modal
        visible={!!editing}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <TouchableWithoutFeedback onPress={handleCancelEdit}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalCenter}
              >
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Edit your review</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {editing?.recipe?.name}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editDraft}
                    onChangeText={setEditDraft}
                    multiline
                    maxLength={MAX_MESSAGE_LENGTH}
                    placeholder="Write your review..."
                    placeholderTextColor={css.palette.neutral500}
                    autoFocus
                    accessibilityLabel="Edit comment message"
                  />
                  <Text style={styles.modalCounter}>
                    {editDraft.length}/{MAX_MESSAGE_LENGTH}
                  </Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancel]}
                      onPress={handleCancelEdit}
                      disabled={savingEdit}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel edit"
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.modalSave,
                        savingEdit && styles.modalSaveDisabled,
                      ]}
                      onPress={handleSaveEdit}
                      disabled={savingEdit || !editDraft.trim()}
                      accessibilityRole="button"
                      accessibilityLabel="Save edited comment"
                    >
                      {savingEdit ? (
                        <ActivityIndicator
                          size="small"
                          color={css.palette.white}
                        />
                      ) : (
                        <Text style={styles.modalSaveText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────
// SortPill
// ────────────────────────────────────────────────────────────────────
function SortPill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.sortPill, active && styles.sortPillActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Sort by ${label}`}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text
        style={[
          styles.sortPillText,
          active && styles.sortPillTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ────────────────────────────────────────────────────────────────────
// SkeletonList — animated placeholder while initial fetch is in flight.
// Single shared opacity loop drives all rows (cheaper than per-row).
// ────────────────────────────────────────────────────────────────────
function SkeletonList() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.listContent} accessibilityLabel="Loading your reviews">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <Animated.View key={i} style={[styles.skeletonRow, animatedStyle]}>
          <View style={styles.skeletonThumb} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonLine, { width: '55%' }]} />
            <View style={[styles.skeletonLine, { width: '90%' }]} />
            <View style={[styles.skeletonLine, { width: '70%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────
// EmptyState
// ────────────────────────────────────────────────────────────────────
function EmptyState({ onCta }) {
  return (
    <View style={styles.centeredState}>
      <FontAwesome
        name="comment-o"
        size={56}
        color={css.palette.neutral300}
      />
      <Text style={styles.emptyTitle}>No reviews yet</Text>
      <Text style={styles.emptyBody}>
        Cook something, share what you thought — your reviews live here.
      </Text>
      <TouchableOpacity
        onPress={onCta}
        style={styles.ctaButton}
        accessibilityRole="button"
        accessibilityLabel="Explore recipes"
      >
        <Text style={styles.ctaText}>Explore recipes</Text>
      </TouchableOpacity>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: css.palette.background,
  },

  // ── HERO ──
  hero: {
    paddingTop: Platform.OS === 'ios' ? css.spacing.xxxl : css.spacing.xl,
    paddingBottom: css.spacing.lg,
    paddingHorizontal: css.spacing.lg,
    borderBottomLeftRadius: css.radius.xl,
    borderBottomRightRadius: css.radius.xl,
    ...css.shadow.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: css.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.overlineSize,
    letterSpacing: css.typography.overlineSpacing,
    color: css.palette.white,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: css.typography.fontDisplay,
    fontSize: css.typography.h2Size,
    lineHeight: css.typography.h2Line,
    color: css.palette.white,
  },
  heroSubtitle: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    lineHeight: css.typography.bodyLine,
    color: css.palette.white,
    opacity: 0.92,
    marginTop: css.spacing.xs,
  },

  // ── SORT ──
  sortRow: {
    flexDirection: 'row',
    gap: css.spacing.sm,
    paddingHorizontal: css.spacing.md,
    paddingTop: css.spacing.md,
    paddingBottom: css.spacing.sm,
  },
  sortPill: {
    minHeight: 44,
    paddingHorizontal: css.spacing.md,
    paddingVertical: css.spacing.sm,
    borderRadius: css.radius.pill,
    backgroundColor: css.palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortPillActive: {
    backgroundColor: css.palette.primary500,
  },
  sortPillText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.bodySmSize,
    color: css.palette.neutral700,
    fontWeight: '500',
  },
  sortPillTextActive: {
    color: css.palette.white,
    fontWeight: '600',
  },

  // ── LIST ──
  listContent: {
    paddingHorizontal: css.spacing.md,
    paddingBottom: css.spacing.xxxl,
  },

  // ── STATES ──
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: css.spacing.lg,
    paddingVertical: css.spacing.xxl,
  },
  errorText: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    color: css.palette.neutral700,
    textAlign: 'center',
    marginTop: css.spacing.md,
  },
  retryButton: {
    marginTop: css.spacing.lg,
    paddingHorizontal: css.spacing.xl,
    paddingVertical: css.spacing.sm,
    backgroundColor: css.palette.primary500,
    borderRadius: css.radius.pill,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.bodySize,
    color: css.palette.white,
    fontWeight: '600',
  },
  emptyTitle: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
    marginTop: css.spacing.md,
  },
  emptyBody: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    lineHeight: css.typography.bodyLine,
    color: css.palette.neutral500,
    textAlign: 'center',
    marginTop: css.spacing.sm,
  },
  ctaButton: {
    marginTop: css.spacing.lg,
    paddingHorizontal: css.spacing.xl,
    paddingVertical: css.spacing.md,
    backgroundColor: css.palette.accent500,
    borderRadius: css.radius.pill,
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.bodySize,
    color: css.palette.primary800,
    fontWeight: '600',
  },

  // ── SKELETON ──
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: css.palette.surfaceCard,
    borderRadius: css.radius.lg,
    padding: css.spacing.sm,
    marginVertical: css.spacing.xs,
    minHeight: 88,
    ...css.shadow.sm,
  },
  skeletonThumb: {
    width: 64,
    height: 64,
    borderRadius: css.radius.md,
    backgroundColor: css.palette.neutral200,
  },
  skeletonBody: {
    flex: 1,
    paddingHorizontal: css.spacing.md,
    gap: css.spacing.xs,
  },
  skeletonLine: {
    height: 10,
    borderRadius: css.radius.xs,
    backgroundColor: css.palette.neutral200,
  },

  // ── EDIT MODAL ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: css.palette.overlayDark,
    justifyContent: 'center',
    paddingHorizontal: css.spacing.lg,
  },
  modalCenter: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: css.palette.surfaceCard,
    borderRadius: css.radius.xl,
    padding: css.spacing.lg,
    ...css.shadow.lg,
  },
  modalTitle: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
  },
  modalSubtitle: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySmSize,
    color: css.palette.neutral500,
    marginTop: css.spacing.xs,
    marginBottom: css.spacing.md,
  },
  modalInput: {
    minHeight: 120,
    maxHeight: 220,
    borderRadius: css.radius.md,
    borderWidth: css.input.borderWidth,
    borderColor: css.palette.neutral300,
    backgroundColor: css.palette.surface,
    padding: css.spacing.md,
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySize,
    color: css.palette.neutral900,
    textAlignVertical: 'top',
  },
  modalCounter: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.captionSize,
    color: css.palette.neutral500,
    textAlign: 'right',
    marginTop: css.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: css.spacing.sm,
    marginTop: css.spacing.lg,
  },
  modalButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: css.spacing.sm,
    borderRadius: css.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    backgroundColor: css.palette.neutral100,
  },
  modalCancelText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.bodySize,
    color: css.palette.neutral700,
    fontWeight: '600',
  },
  modalSave: {
    backgroundColor: css.palette.primary800,
  },
  modalSaveDisabled: {
    backgroundColor: css.palette.neutral300,
  },
  modalSaveText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.bodySize,
    color: css.palette.white,
    fontWeight: '600',
  },
});
