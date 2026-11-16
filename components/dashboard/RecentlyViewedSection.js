// RecentlyViewedSection — horizontal cards of the last viewed recipes.
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { resolveRecipeImageSource } from '../../modules/recipeImage';
import RecipeImage from '../recipe/RecipeImage';
import StarRating from './StarRating';

// Cards scale with the viewport so small devices (iPhone SE ~375pt) don't get
// oversized images while wider devices keep good density. ~42% of the screen
// yields ~2.3 cards visible at a glance; clamped to keep the layout legible at
// both extremes. Aspect ratio 4:5 (height = w * 1.1) gives the gradient
// overlay room for a 2-line title + 5 stars.
const CARD_WIDTH_RATIO = 0.42;
const CARD_MIN_WIDTH = 140;
const CARD_MAX_WIDTH = 180;
const CARD_ASPECT = 1.1;

/**
 * @param {{ recipes: object[], onOpen: (recipe: object) => void }} props
 */
export default function RecentlyViewedSection({ recipes, onOpen }) {
  const css = useTheme();
  const t = useT();
  const { width: screenWidth } = useWindowDimensions();

  // Recomputed on rotation / split-view.
  const cardWidth = useMemo(() => {
    const target = screenWidth * CARD_WIDTH_RATIO;
    return Math.round(Math.min(CARD_MAX_WIDTH, Math.max(CARD_MIN_WIDTH, target)));
  }, [screenWidth]);
  const cardHeight = Math.round(cardWidth * CARD_ASPECT);

  if (recipes.length === 0) return null;

  return (
    <View style={{ marginTop: css.spacing.lg, paddingHorizontal: css.spacing.md }}>
      <Text
        style={{
          fontFamily: css.typography.fontHeading,
          fontSize: css.typography.h3Size,
          color: css.palette.neutral900,
          marginBottom: css.spacing.md,
        }}
      >
        {t('userDashboard.recentlyViewed')}
      </Text>
      <FlatList
        data={recipes}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingRight: css.spacing.md, gap: css.spacing.cardGap }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                width: cardWidth,
                height: cardHeight,
                borderRadius: css.radius.card,
                backgroundColor: css.palette.neutral200,
              },
            ]}
            onPress={() => onOpen(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('userDashboard.viewRecipeA11y', { name: item.name })}
          >
            <RecipeImage
              source={resolveRecipeImageSource(item)}
              style={styles.cardImage}
              iconSize={32}
            />
            <LinearGradient
              colors={css.gradient.imageOverlay.colors}
              locations={css.gradient.imageOverlay.locations}
              style={[
                styles.cardOverlay,
                { paddingHorizontal: css.spacing.sm, paddingBottom: css.spacing.sm },
              ]}
            >
              <Text
                style={{
                  fontFamily: css.typography.fontHeading,
                  fontSize: css.typography.h5Size,
                  color: css.palette.white,
                }}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <StarRating votes={item.votes} size={11} style={{ marginTop: css.spacing.xs }} />
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
  );
}

const styles = StyleSheet.create({
  card: {
    // width + height applied inline (responsive via useWindowDimensions)
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
  },
  originPill: {
    position: 'absolute',
  },
  originPillText: {
    textTransform: 'uppercase',
  },
});
