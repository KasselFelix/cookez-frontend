import React, { useRef, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import imageRecipe from '../../modules/images';
import css from '../../styles/Global';

/**
 * UserCommentCard
 * ----------------
 * Horizontal "Micro-Blog" row used in the Contribution Hub (CommentScreen).
 * Wraps in a `Swipeable` so the user can swipe left-to-reveal Edit/Delete
 * actions without leaving the list.
 *
 * Props:
 *   comment   { _id, message, up[], recipe: { _id, name, image }, ... }
 *   onPress   () => void   — invoked when the row body is tapped (parent navigates)
 *   onEdit    () => void   — invoked from the swipe Edit action
 *   onDelete  () => void   — invoked from the swipe Delete action
 *
 * Image resolution: prefer the local require map (`imageRecipe[`${image}.jpg`]`).
 * Fall back to Cloudinary by treating the `image` field as the public_id stem
 * (matches RecipeScreen's pattern: `${recipe.picture}.jpg`).
 */
function resolveSource(image) {
  if (!image) return null;
  const local = imageRecipe[`${image}.jpg`];
  if (local) return local;
  return { uri: `https://res.cloudinary.com/dnym6kt4p/image/upload/${image}.jpg` };
}

function UserCommentCard({ comment, onPress, onEdit, onDelete }) {
  const swipeRef = useRef(null);
  const recipe = comment?.recipe ?? {};
  const upCount = comment?.up?.length ?? 0;
  const source = resolveSource(recipe.image);

  // Renders the right-side action drawer revealed on left-swipe.
  // `progress` interpolates 0→1 as the row slides; we use it to spring the
  // buttons in (translateX) so they feel attached to the gesture.
  const renderRightActions = useCallback(
    (progress) => {
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [160, 0],
        extrapolate: 'clamp',
      });
      return (
        <Animated.View
          style={[styles.actionsRow, { transform: [{ translateX }] }]}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.editAction]}
            onPress={() => {
              swipeRef.current?.close();
              onEdit?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit comment"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="pencil" size={20} color={css.palette.white} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteAction]}
            onPress={() => {
              swipeRef.current?.close();
              onDelete?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Delete comment"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="trash" size={20} color={css.palette.white} />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [onEdit, onDelete]
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Open recipe ${recipe.name || 'unknown'}`}
      >
        <View style={styles.thumbWrap}>
          {source ? (
            <Image
              source={source}
              style={styles.thumb}
              contentFit="cover"
              transition={200}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <FontAwesome
                name="cutlery"
                size={20}
                color={css.palette.neutral500}
              />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.recipeName} numberOfLines={1}>
            {recipe.name || 'Untitled recipe'}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {comment?.message}
          </Text>
        </View>

        <View
          style={styles.scorePill}
          accessibilityLabel={`${upCount} upvotes`}
        >
          <FontAwesome
            name="thumbs-up"
            size={12}
            color={css.palette.primary800}
          />
          <Text style={styles.scoreText}>{upCount}</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

// Memoise — list rows shouldn't re-render unless their comment shape changes.
export default React.memo(UserCommentCard, (prev, next) => {
  const a = prev.comment;
  const b = next.comment;
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a._id === b._id &&
    a.message === b.message &&
    (a.up?.length ?? 0) === (b.up?.length ?? 0) &&
    a.recipe?._id === b.recipe?._id &&
    a.recipe?.name === b.recipe?.name &&
    a.recipe?.image === b.recipe?.image
  );
});

const THUMB_SIZE = 64;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: css.palette.surfaceCard,
    borderRadius: css.radius.lg,
    padding: css.spacing.sm,
    marginVertical: css.spacing.xs,
    minHeight: 88,
    ...css.shadow.sm,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: css.radius.md,
    overflow: 'hidden',
    backgroundColor: css.palette.neutral200,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: css.spacing.md,
    justifyContent: 'center',
  },
  recipeName: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h4Size,
    color: css.palette.neutral900,
    marginBottom: css.spacing.xs,
  },
  message: {
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySmSize,
    lineHeight: css.typography.bodySmLine,
    color: css.palette.neutral700,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: css.spacing.xs,
    paddingVertical: css.spacing.xs,
    paddingHorizontal: css.spacing.sm,
    borderRadius: css.radius.pill,
    backgroundColor: css.palette.secondary200,
    minHeight: 28,
    minWidth: 48,
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.captionSize,
    color: css.palette.primary800,
  },
  // Right-swipe action drawer
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginVertical: css.spacing.xs,
    marginLeft: css.spacing.sm,
  },
  actionButton: {
    width: 80,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: css.spacing.sm,
  },
  editAction: {
    backgroundColor: css.palette.primary500,
    borderTopLeftRadius: css.radius.lg,
    borderBottomLeftRadius: css.radius.lg,
  },
  deleteAction: {
    backgroundColor: css.palette.error,
    borderTopRightRadius: css.radius.lg,
    borderBottomRightRadius: css.radius.lg,
  },
  actionText: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.captionSize,
    color: css.palette.white,
    marginTop: css.spacing.xs,
    fontWeight: '600',
  },
});
