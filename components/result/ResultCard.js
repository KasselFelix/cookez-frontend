// Result cards (ResultScreen): the best match as a large photo card, the others
// as compact rows. Each shows the origin flag, time, difficulty and rating, a
// leaf when the recipe is in season, and how much of it the user already owns.
// Colors come from css.result (cream page in light, Home color elsewhere).

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Root import as in components/kickoff/UnmatchedChips (D17).
import { ChefHat, Clock, Leaf, Star } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { i18n } from '../../i18n';
import { PLACEHOLDER_IMAGE_KEY, resolveRecipeImageSource } from '../../modules/recipeImage';
import recipeImages from '../../modules/images';
import { toResultCard } from '../../modules/resultCard';

function useCard(recipe) {
  return toResultCard(recipe, i18n.locale);
}

// The recipe photo; without one, a quiet block with a chef hat instead of the
// app logo cropped by `cover`.
function RecipePhoto({ recipe, style, iconSize }) {
  const css = useTheme();
  const source = resolveRecipeImageSource(recipe);
  if (source === recipeImages[PLACEHOLDER_IMAGE_KEY]) {
    return (
      <View testID="recipe-card-image" style={[style, styles.center, { backgroundColor: css.result.meterTrack }]}>
        <ChefHat size={iconSize} color={css.result.muted} />
      </View>
    );
  }
  return <Image testID="recipe-card-image" source={source} style={[style, { backgroundColor: css.result.meterTrack }]} resizeMode="cover" accessibilityLabel={recipe.name} />;
}

// Round leaf badge of a seasonal recipe.
function SeasonBadge({ size = 26 }) {
  const css = useTheme();
  const t = useT();
  return (
    <View
      accessible
      accessibilityLabel={t('result.seasonalBadge.label')}
      testID="result-seasonal"
      style={[styles.center, { width: size, height: size, borderRadius: css.radius.pill, backgroundColor: css.result.seasonBg }]}
    >
      <Leaf size={Math.round(size * 0.55)} color={css.result.seasonInk} />
    </View>
  );
}

// Flag · time · difficulty · rating, on one line. `ink` is white over a photo.
function Meta({ card, ink, showOrigin = true }) {
  const css = useTheme();
  const t = useT();
  const text = { fontFamily: css.typography.fontUI, fontSize: css.typography.captionSize + 1, color: ink };
  const origin = showOrigin && card.origins[0];
  return (
    <View style={[styles.row, styles.wrap, { columnGap: css.spacing.md, rowGap: 2 }]}>
      {!!origin && (
        <Text style={text} numberOfLines={1}>
          {origin.flag ? `${origin.flag} ${origin.name}` : origin.name}
        </Text>
      )}
      {card.minutes != null && (
        <View style={[styles.row, { gap: 4 }]}>
          <Clock size={14} color={ink} />
          <Text style={text}>{t('recipe.meta.minutes', { count: card.minutes })}</Text>
        </View>
      )}
      {card.difficulty != null && (
        <View style={[styles.row, { gap: 4 }]}>
          <ChefHat size={14} color={ink} />
          <Text style={text}>{t('result.card.difficulty', { value: card.difficulty })}</Text>
        </View>
      )}
      {card.rating != null && (
        <View style={[styles.row, { gap: 4 }]}>
          <Star size={14} color={css.palette.accent400} fill={css.palette.accent400} />
          <Text style={text}>{t('result.card.rating', { value: card.rating, count: card.votes })}</Text>
        </View>
      )}
    </View>
  );
}

// "75% owned · 2 to buy" over a thin meter.
function MatchMeter({ card }) {
  const css = useTheme();
  const t = useT();
  if (card.match == null) return null;
  const label = card.missing > 0 ? t('result.card.missing', { count: card.missing }) : t('result.card.allOwned');
  const caption = { fontFamily: css.typography.fontUI, fontSize: css.typography.captionSize + 1 };
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${t('result.matchBadge.a11y', { ratio: card.match })}, ${label}`}>
      <View style={[styles.row, styles.between]}>
        <Text style={[caption, { color: css.result.ink, fontWeight: '700' }]}>{t('result.matchBadge.label', { ratio: card.match })}</Text>
        <Text style={[caption, { color: css.result.muted }]}>{label}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: css.result.meterTrack, borderRadius: css.radius.pill }]}>
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, card.match))}%`, backgroundColor: css.result.meterFill, borderRadius: css.radius.pill }]} />
      </View>
    </View>
  );
}

/** The best match: a large photo, its name over the overlay gradient. */
export function ResultHero({ recipe, onPress }) {
  const css = useTheme();
  const t = useT();
  const card = useCard(recipe);
  const topRadius = { borderTopLeftRadius: css.radius.card, borderTopRightRadius: css.radius.card };
  return (
    <Pressable
      testID="recipe-card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={recipe.name}
      style={({ pressed }) => [{ backgroundColor: css.result.card, borderRadius: css.radius.card, opacity: pressed ? 0.92 : 1 }, css.shadow.sm]}
    >
      <View style={[styles.hero, topRadius]}>
        <RecipePhoto recipe={recipe} style={styles.fillImage} iconSize={56} />
        <LinearGradient
          colors={css.gradient.imageOverlay.colors}
          locations={css.gradient.imageOverlay.locations}
          style={[StyleSheet.absoluteFill, styles.overlay, { padding: css.spacing.md, gap: 4 }]}
          pointerEvents="none"
        >
          <Text numberOfLines={2} style={{ fontFamily: css.typography.fontHeading, fontSize: css.typography.h2Size, color: css.palette.white, fontWeight: '700' }}>
            {recipe.name}
          </Text>
          <Meta card={card} ink={css.palette.white} />
        </LinearGradient>
        <View style={[styles.ribbon, { top: css.spacing.sm, left: css.spacing.sm, backgroundColor: css.result.ribbonBg, borderRadius: css.radius.pill, paddingHorizontal: css.spacing.sm }]}>
          <Text style={{ fontFamily: css.typography.fontUI, fontSize: css.typography.captionSize, color: css.result.ribbonInk, fontWeight: '700' }}>
            {t('result.card.bestMatch')}
          </Text>
        </View>
        {card.seasonal && (
          <View style={[styles.corner, { top: css.spacing.sm, right: css.spacing.sm }]}>
            <SeasonBadge size={30} />
          </View>
        )}
      </View>
      {card.match != null && (
        <View style={{ padding: css.spacing.md }}>
          <MatchMeter card={card} />
        </View>
      )}
    </Pressable>
  );
}

/** Any other result: thumbnail, name, meta line and match meter. */
export function ResultRow({ recipe, onPress }) {
  const css = useTheme();
  const card = useCard(recipe);
  return (
    <Pressable
      testID="recipe-card"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={recipe.name}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: css.result.card, borderRadius: css.radius.lg, padding: css.spacing.sm, gap: css.spacing.md, opacity: pressed ? 0.92 : 1 },
        css.shadow.sm,
      ]}
    >
      <RecipePhoto recipe={recipe} style={[styles.thumb, styles.clip, { borderRadius: css.radius.md }]} iconSize={30} />
      <View style={[styles.flex, { gap: 6 }]}>
        <View style={[styles.row, { gap: css.spacing.xs }]}>
          <Text numberOfLines={1} style={[styles.flexShrink, { fontFamily: css.typography.fontHeading, fontSize: css.typography.h4Size, color: css.result.ink, fontWeight: '700' }]}>
            {recipe.name}
          </Text>
          {card.seasonal && <SeasonBadge size={22} />}
        </View>
        <Meta card={card} ink={css.result.muted} />
        <MatchMeter card={card} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  between: { justifyContent: 'space-between' },
  center: { alignItems: 'center', justifyContent: 'center' },
  hero: { height: 220, overflow: 'hidden' },
  fillImage: { width: '100%', height: '100%' },
  overlay: { justifyContent: 'flex-end' },
  ribbon: { position: 'absolute', paddingVertical: 4 },
  corner: { position: 'absolute' },
  thumb: { width: 84, height: 84 },
  clip: { overflow: 'hidden' },
  track: { height: 6, overflow: 'hidden' },
  fill: { height: 6 },
});
