// RecipeImage — a recipe photo in a list or a card (profile grids, dashboard, comments). When the
// recipe has no usable image, or the image fails to load, it renders RecipeImagePlaceholder in the
// same frame, so a card never shows a blank block or the cropped bundled placeholder file.
import { useState } from 'react';
import { Image } from 'expo-image';

import { isPlaceholderSource } from '../../modules/recipeImage';
import RecipeImagePlaceholder from './RecipeImagePlaceholder';

const keyOf = (source) => (typeof source === 'number' ? String(source) : source?.uri ?? '');

/**
 * @param {{
 *   source: { uri?: string|null } | number | null | undefined,
 *   style?: any,
 *   iconSize?: number,
 *   accessibilityLabel?: string,
 *   testID?: string,
 * }} props
 *   source: usually from `resolveRecipeImageSource`; null, an empty uri or the bundled
 *   placeholder all render the themed placeholder.
 */
export default function RecipeImage({ source, style, iconSize = 28, accessibilityLabel, testID = 'recipe-image' }) {
  // Remembers which source failed, so a new source gets its own chance to load.
  const [failedKey, setFailedKey] = useState(null);
  const key = keyOf(source);
  const unusable = !key || isPlaceholderSource(source) || failedKey === key;

  if (unusable) {
    return <RecipeImagePlaceholder style={style} iconSize={iconSize} />;
  }
  return (
    <Image
      testID={testID}
      source={source}
      style={style}
      contentFit="cover"
      transition={200}
      accessibilityIgnoresInvertColors
      accessibilityLabel={accessibilityLabel}
      onError={() => setFailedKey(key)}
    />
  );
}
