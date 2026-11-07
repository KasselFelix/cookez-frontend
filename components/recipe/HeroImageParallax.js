import React, { useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import css from '../../styles/Global';
import { isPlaceholderSource } from '../../modules/recipeImage';
import RecipeImagePlaceholder from './RecipeImagePlaceholder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const HERO_HEIGHT = 360;

/**
 * HeroImageParallax
 * Scroll-driven parallax: the image scales as you over-pull and translates upward
 * proportionally to scroll. Gradient overlay ensures legibility of any overlaid UI.
 *
 * @param {SharedValue<number>} scrollY — reanimated shared value of scroll offset
 * @param {{ uri: string } | number} [source] — a resolved Image source (preferred,
 *   produced by `resolveRecipeImageSource`). Always non-empty.
 * @param {string} [uri] — legacy: full image URI (used only if `source` absent).
 * @param {ImageSourcePropType} [localSource] — legacy: require()'d local fallback.
 */
export default function HeroImageParallax({ scrollY, source, uri, localSource }) {
  const animatedImageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-HERO_HEIGHT, 0, HERO_HEIGHT],
      [-HERO_HEIGHT / 2, 0, HERO_HEIGHT / 3],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-HERO_HEIGHT, 0],
      [2, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Prefer the resolved `source`; fall back to the legacy uri/localSource API.
  const imageSource = source ?? (localSource || { uri });
  // No usable image, or a URL that fails to load: the themed placeholder, never a blank hero.
  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = imageFailed || isPlaceholderSource(imageSource);

  return (
    <View style={styles.container} accessibilityRole="image" accessible>
      <Animated.View style={[styles.imageWrapper, animatedImageStyle]}>
        {showPlaceholder ? (
          <RecipeImagePlaceholder style={styles.image} iconSize={56} />
        ) : (
          <Image
            source={imageSource}
            style={styles.image}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
            onError={() => setImageFailed(true)}
          />
        )}
      </Animated.View>
      {/* The overlay keeps text legible over a photo; on the flat placeholder it only muddies it. */}
      {!showPlaceholder && (
        <LinearGradient
          colors={css.gradient.imageOverlay.colors}
          locations={css.gradient.imageOverlay.locations}
          style={styles.gradient}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    overflow: 'hidden',
    backgroundColor: css.palette.neutral200,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
});
