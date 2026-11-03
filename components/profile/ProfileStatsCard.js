import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

const AVATAR_SIZE = 56;

/**
 * ProfileStatsCard
 *
 * Compact, tappable profile summary used as a navigation affordance — opens
 * the full profile when pressed. Horizontal layout: avatar | name + bio |
 * three inline stats (Recipes / Followers / Following).
 *
 * Visual hierarchy (5-second test):
 *  1. Avatar (left anchor, 56pt circle).
 *  2. Name (h4, bold).
 *  3. Bio (muted caption, 1-line truncated).
 *  4. Stats — secondary social signals, right column.
 *
 * Signature: subtle spring scale on press (0.98 → 1) reusing the project's
 * `css.animation.spring` token so the motion matches every other interactive
 * surface (CommentCard, etc.). No haptics — this is a navigation tap, not a
 * commit action.
 *
 * Props:
 *  - name       : string              — display name (rendered as h4 header)
 *  - bio        : string              — one-line bio, truncated to 1 line
 *  - avatarUri? : string              — remote URL (e.g. Cloudinary)
 *  - recipes    : number              — count
 *  - followers  : number              — count
 *  - following  : number              — count
 *  - onPress?   : () => void          — tap handler (no-op if omitted)
 */
function ProfileStatsCard({
  name,
  bio,
  avatarUri,
  recipes,
  followers,
  following,
  onPress,
}) {
  const css = useTheme();
  const t = useT();

  // Spring scale on press — UI thread, matches CommentCard's pattern
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, css.animation.spring);
  }, [scale, css.animation.spring]);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, css.animation.spring);
  }, [scale, css.animation.spring]);

  const labels = useMemo(
    () => ({
      recipes: t('profile.statsCard.recipes'),
      followers: t('profile.statsCard.followers'),
      following: t('profile.statsCard.following'),
    }),
    [t]
  );

  // Accessibility label: collapses the whole card into one screen-reader
  // utterance — name, then the three counts in plain language. Roles on the
  // child Texts are intentionally omitted because the Pressable owns the
  // semantic boundary.
  const a11yLabel = t('profile.statsCard.a11yLabel', {
    name,
    recipes,
    followers,
    following,
  });

  const stats = [
    { key: 'recipes', value: recipes, label: labels.recipes },
    { key: 'followers', value: followers, label: labels.followers },
    { key: 'following', value: following, label: labels.following },
  ];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={t('profile.statsCard.a11yHint')}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: css.palette.surfaceCard,
            borderColor: css.palette.neutral200,
            borderRadius: css.radius.lg,
            paddingVertical: css.spacing.md,
            paddingHorizontal: css.spacing.md,
            // Match the rest of the cookez card surfaces (soft top-down shadow)
            ...css.shadow.sm,
            // Pressable opacity fallback for platforms where the spring is
            // suppressed (e.g. screen readers in some configurations).
            opacity: pressed ? 0.98 : 1,
          },
        ]}
      >
        {/* Avatar */}
        <View
          style={[
            styles.avatarWrap,
            { backgroundColor: css.palette.neutral200 },
          ]}
        >
          <Image
            source={avatarUri ? { uri: avatarUri } : undefined}
            style={styles.avatar}
            contentFit="cover"
            transition={300}
            recyclingKey={avatarUri || name}
            accessibilityIgnoresInvertColors
          />
        </View>

        {/* Identity (flex:1 — pushes stats to the right and lets bio truncate) */}
        <View style={styles.identity}>
          <Text
            numberOfLines={1}
            accessibilityRole="header"
            style={{
              fontFamily: css.typography.fontHeading,
              fontSize: css.typography.h4Size,
              lineHeight: css.typography.h4Line,
              fontWeight: '700',
              color: css.palette.neutral900,
            }}
          >
            {name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: css.typography.fontUI,
              fontSize: css.typography.h6Size,
              lineHeight: css.typography.h6Line,
              color: css.palette.neutral500,
              marginTop: css.spacing.xs,
            }}
          >
            {bio}
          </Text>
        </View>

        {/* Stats — tight inline cluster on the right */}
        <View
          style={[styles.stats, { marginLeft: css.spacing.md }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {stats.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.statCell,
                i > 0 && { marginLeft: css.spacing.sm },
              ]}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: css.typography.fontHeading,
                  fontSize: css.typography.h5Size,
                  lineHeight: css.typography.h5Line,
                  fontWeight: '700',
                  color: css.palette.neutral900,
                  textAlign: 'center',
                }}
              >
                {formatCount(s.value)}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: css.typography.fontUI,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: css.palette.neutral500,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Compact count formatter — keeps stat cells visually balanced when counts
 * grow into the thousands (e.g. "1.2k") without forcing the whole card to
 * widen.
 */
function formatCount(n) {
  const value = typeof n === 'number' ? n : Number(n) || 0;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    // Comfortable touch target — well above the 44pt minimum, but enforced
    // explicitly so the contract holds if padding tokens ever shrink.
    minHeight: 72,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  identity: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Memoized — the parent screen will often re-render (Redux subscriptions);
// stat counts and identity strings rarely change, so memo pays for itself.
export default React.memo(ProfileStatsCard);
export { ProfileStatsCard };
