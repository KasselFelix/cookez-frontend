// RecipeImagePlaceholder — stands in for a recipe photo that is missing or fails to load (recipe
// card, recipe hero). A quiet themed surface with a chef-hat medallion, instead of the cropped
// logo image: it reads as "no photo" without shouting, in all five themes.
import { StyleSheet, View } from 'react-native';
// Root import until the D17 migration (phase 6): 1.14 exports no per-icon path, and the 17
// existing root imports already bundle the whole library, so this one adds no bytes.
// eslint-disable-next-line no-restricted-imports
import { ChefHat } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

/**
 * @param {{ iconSize?: number, style?: any, testID?: string }} props
 *   iconSize: icon size in points (the medallion is twice as large).
 */
export default function RecipeImagePlaceholder({ iconSize = 40, style, testID = 'recipe-image-placeholder' }) {
  const css = useTheme();
  const t = useT();

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('recipe.image.placeholder')}
      style={[styles.root, { backgroundColor: css.card.tagBg }, style]}
    >
      <View
        style={[
          styles.medallion,
          {
            width: iconSize * 2,
            height: iconSize * 2,
            borderRadius: css.radius.pill,
            backgroundColor: css.palette.surfaceCard,
          },
        ]}
      >
        <ChefHat size={iconSize} color={css.palette.primary800} strokeWidth={1.5} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  medallion: { alignItems: 'center', justifyContent: 'center' },
});
