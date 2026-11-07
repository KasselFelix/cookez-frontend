import { FontAwesome } from "@expo/vector-icons";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from "../contexts/ThemeProvider";
import useT from "../i18n/useT";
import MatchBadge from './result/MatchBadge';
import SeasonalBadge from './result/SeasonalBadge';
import { flagForOriginName } from '../modules/countries';
import { useState } from 'react';
import { isPlaceholderSource, resolveRecipeImageSource } from '../modules/recipeImage';
import { openRecipe } from '../modules/recipeNavigation';
import RecipeImagePlaceholder from './recipe/RecipeImagePlaceholder';

const formatOrigin = (origin) => {
  const items = Array.isArray(origin) ? origin : origin ? [origin] : [];
  return items.map((name) => `${flagForOriginName(name)} ${name}`).join(' · ');
};

/**
 * Recipe card — partagé entre ResultScreen (search flow) et FavoriteScreen.
 * Par défaut, le card ne propage AUCUN servings override à RecipeScreen.
 * `fromRecipeSearch={true}` doit être passé UNIQUEMENT depuis ResultScreen
 * (qui présuppose un passage par RecapScreen). Sinon RecipeScreen tombera
 * sur la branche `householdComposition` ou `recipe.servings` selon le
 * contexte (user loggué vs guest).
 *
 * U-A16 (Plan 005) — résilient aux recettes importées null-heavy :
 *   - image via `resolveRecipeImageSource` (imageUrl http > picture local/
 *     Cloudinary > placeholder) — jamais de <Image> cassée ;
 *   - difficulty / preparationTime masqués quand null (pas de "null/5" / "nullm").
 */
export default function Recipe(props) {
  const css = useTheme();
  const t = useT();

  const note =
    Array.isArray(props.votes) && props.votes.length
      ? Math.floor(props.votes.reduce((acc, v) => acc + (v?.note ?? 0), 0) / props.votes.length)
      : 0;

  const voteRecipe = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name="star"
          size={18}
          color={i < note ? css.palette.accent400 : css.palette.neutral300}
        />,
      );
    }
    return stars;
  };

  const imageSource = resolveRecipeImageSource(props);
  // No usable image, or a URL that fails to load: the themed placeholder, never a blank frame.
  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = imageFailed || isPlaceholderSource(imageSource);
  const originLabel = formatOrigin(props.origin);
  const hasDifficulty = props.difficulty != null;
  const hasPrepTime = props.preparationTime != null;

  return (
    <View style={[styles.shadowWrap, { backgroundColor: css.palette.surfaceCard }, css.shadow.heavy,
      Platform.select({
        ios: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8 },
        android: {},
      })]}
    >
      <TouchableOpacity
        testID="recipe-card"
        style={[styles.recipeContainer, { backgroundColor: css.palette.surfaceCard }]}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={props.name}
        onPress={() => openRecipe(props.navigation, props, { fromRecipeSearch: props.fromRecipeSearch === true })}
      >
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{props.name}</Text>
          {!!originLabel && <Text> {originLabel}</Text>}
        </View>
        <View style={styles.imageContainer}>
          {showPlaceholder ? (
            <RecipeImagePlaceholder style={styles.image} iconSize={36} />
          ) : (
            <Image
              testID="recipe-card-image"
              style={[styles.image, { backgroundColor: css.palette.secondary500 }]}
              source={imageSource}
              accessibilityLabel={props.name}
              onError={() => setImageFailed(true)}
            />
          )}
          <View style={styles.voteContainer}>
            <View style={styles.vote}>{voteRecipe()}</View>
            <Text> votes: {props.votes?.length ?? 0}</Text>
          </View>
        </View>
        <View style={styles.badgeRow}>
          <MatchBadge ratio={props.matchRatio} />
          {props.isSeasonal && <SeasonalBadge />}
        </View>
        {(hasDifficulty || hasPrepTime) && (
          <View style={styles.infos}>
            {hasDifficulty && (
              <Text style={styles.text}>
                {t('recipe.meta.difficulty', { value: props.difficulty })}
              </Text>
            )}
            {hasPrepTime && (
              <Text style={styles.text}>
                {t('recipe.meta.minutes', { count: props.preparationTime })}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: 330,
    height: 340,
    borderRadius: 10,
    marginBottom: '5%',
    // iOS: shadow softened (less halo + tighter spread) to keep the card
    // grounded without overpowering the surrounding peach background.
    // Android keeps `elevation` from `shadow.heavy` for visual parity.
  },

  recipeContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },

  nameContainer: {
    paddingLeft: '3%',
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  imageContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: '3%',
    marginLeft: '10%',
    width: '80%',
  },

  image: {
    width: '110%',
    height: '94%',
    borderRadius: 10,
  },

  voteContainer: {
    flex: 0,
    alignItems: 'flex-end',
    width: '100%',
  },

  vote: {
    flex: 0,
    flexDirection: 'row',
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: '3%',
    marginTop: 8,
  },

  infos: {
    marginTop: '6%',
    marginBottom: '3%',
    paddingLeft: '3%',
  },

  text: {
    fontSize: 16,
  },
});
