import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSelector, shallowEqual } from 'react-redux';
import CommentCard from './CommentCard';
import css from '../../styles/Global';

/**
 * CommentsSection
 * Reads comments from Redux (single source of truth) — never holds local state.
 *
 * @param {string} recipeId
 * @param {() => void} onPromptCompose — opens the BottomSheet composer
 */
export default function CommentsSection({ recipeId, onPromptCompose }) {
  const comments = useSelector((state) => {
    const recipe = state.recipe.value.find((r) => r._id === recipeId);
    return recipe?.comments ?? [];
  }, shallowEqual);

  const hasComments = comments.length > 0;

  const sortedComments = useMemo(() => {
    if (!hasComments) return comments;
    // Newest first — defensive fallback if `date` missing
    return [...comments].sort((a, b) => {
      const ta = a?.date ? new Date(a.date).getTime() : 0;
      const tb = b?.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });
  }, [comments, hasComments]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Comments {hasComments ? `(${comments.length})` : ''}
        </Text>
      </View>

      {!hasComments ? (
        <TouchableOpacity
          style={styles.emptyState}
          onPress={onPromptCompose}
          accessibilityRole="button"
          accessibilityLabel="Be the first to comment"
          activeOpacity={0.7}
        >
          <FontAwesome
            name="comment-o"
            size={32}
            color={css.palette.primary600}
          />
          <Text style={styles.emptyTitle}>Be the first to comment</Text>
          <Text style={styles.emptyHint}>
            Share your tips or ask the chef a question.
          </Text>
        </TouchableOpacity>
      ) : (
        <View>
          {sortedComments.map((c, i) => (
            <CommentCard
              // _id is the canonical key; index fallback guarantees uniqueness
              // even if both _id and username/date are missing — fixes
              // "Encountered two children with the same key (undefined-undefined)".
              key={c._id ? String(c._id) : `comment-fallback-${i}`}
              recipeId={recipeId}
              {...c}
              up={c.up ?? []}
              down={c.down ?? []}
              usersAlreadyUpVoted={c.usersAlreadyUpVoted ?? []}
              usersAlreadyDownVoted={c.usersAlreadyDownVoted ?? []}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: css.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: css.spacing.sm,
  },
  title: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h3Size,
    color: css.palette.neutral900,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: css.spacing.xl,
    paddingHorizontal: css.spacing.lg,
    backgroundColor: css.palette.secondary200,
    borderRadius: css.radius.lg,
    minHeight: 44,
  },
  emptyTitle: {
    marginTop: css.spacing.sm,
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h4Size,
    color: css.palette.primary800,
  },
  emptyHint: {
    marginTop: css.spacing.xs,
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySmSize,
    color: css.palette.neutral700,
    textAlign: 'center',
  },
});
