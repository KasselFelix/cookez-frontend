import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import css from '../../styles/Global';

/**
 * ActionRow
 * Horizontal row of primary recipe actions: favorite, vote, comment.
 * All actions share a consistent 44x44 hit area with accessibility metadata.
 */
export default function ActionRow({
  isFavorite,
  onFavorite,
  onVote,
  onComment,
  avgNote = 0,
  nbVotes = 0,
}) {
  const handlePress = (handler) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (handler) handler();
  };

  const fullStars = Math.floor(Number(avgNote) || 0);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress(onFavorite)}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        accessibilityState={{ selected: !!isFavorite }}
        activeOpacity={0.7}
      >
        <FontAwesome
          name="heart"
          size={22}
          color={isFavorite ? css.palette.favorite : css.palette.neutral500}
        />
        <Text style={styles.label}>{isFavorite ? 'Saved' : 'Save'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handlePress(onVote)}
        accessibilityRole="button"
        accessibilityLabel={`Rate this recipe. Current rating ${avgNote.toFixed(1)} from ${nbVotes} votes`}
        activeOpacity={0.7}
      >
        <View style={styles.starsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <FontAwesome
              key={i}
              name="star"
              size={16}
              color={i < fullStars ? css.palette.warning : css.palette.neutral300}
            />
          ))}
        </View>
        <Text style={styles.label}>{nbVotes} {nbVotes === 1 ? 'vote' : 'votes'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handlePress(onComment)}
        accessibilityRole="button"
        accessibilityLabel="Add a comment"
        activeOpacity={0.7}
      >
        <FontAwesome name="comment-o" size={22} color={css.palette.primary800} />
        <Text style={styles.label}>Comment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: css.spacing.sm,
    paddingHorizontal: css.spacing.md,
    backgroundColor: css.palette.surfaceCard,
    borderRadius: css.radius.lg,
    marginTop: css.spacing.md,
    marginBottom: css.spacing.md,
    ...css.shadow.sm,
  },
  button: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: css.spacing.xs,
    paddingHorizontal: css.spacing.sm,
  },
  label: {
    marginTop: css.spacing.xs,
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.captionSize,
    color: css.palette.neutral700,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
});
