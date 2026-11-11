// CommunityRecipeCard — one row of the Community Favorites list: photo, name,
// preparation time, difficulty and stars.
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { resolveRecipeImageSource } from '../../modules/recipeImage';
import RecipeImage from '../recipe/RecipeImage';
import StarRating from './StarRating';

const CARD_HEIGHT = 100;
const IMAGE_WIDTH_RATIO = 0.35;

/**
 * @param {{ recipe: object, onOpen: (recipe: object) => void }} props
 */
export default function CommunityRecipeCard({ recipe, onOpen }) {
  const css = useTheme();
  const t = useT();
  const metaStyle = {
    fontFamily: css.typography.metadataFamily,
    fontSize: css.typography.metadataSize,
    color: css.typography.metadataColor,
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: css.palette.surfaceCard,
          borderRadius: css.radius.card,
          marginBottom: css.spacing.cardGap,
        },
        css.shadow.card,
      ]}
      onPress={() => onOpen(recipe)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('userDashboard.viewRecipeA11y', { name: recipe.name })}
    >
      <RecipeImage
        source={resolveRecipeImageSource(recipe)}
        style={styles.image}
        iconSize={22}
      />
      <View
        style={[
          styles.content,
          { paddingVertical: css.spacing.sm, paddingHorizontal: css.spacing.md },
        ]}
      >
        <Text
          style={{
            fontFamily: css.typography.fontHeading,
            fontSize: css.typography.h4Size,
            color: css.palette.neutral900,
          }}
          numberOfLines={2}
        >
          {recipe.name}
        </Text>
        <View style={[styles.meta, { marginTop: css.spacing.xs }]}>
          <Text style={metaStyle}>
            {recipe.preparationTime ? `${recipe.preparationTime} ${t('userDashboard.meta.minutesShort')}` : '–'}
          </Text>
          <Text style={metaStyle}>{' · '}</Text>
          <Text style={metaStyle}>
            {recipe.difficulty ? t('userDashboard.meta.difficulty', { value: recipe.difficulty }) : '–'}
          </Text>
        </View>
        <StarRating votes={recipe.votes} size={13} style={{ marginTop: css.spacing.xs }} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  image: {
    width: `${Math.round(IMAGE_WIDTH_RATIO * 100)}%`,
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
