// RecipeVideoButton — Plan 005 U-A16.
//
// Imported recipes may carry a `videoUrl` (YouTube or a direct mp4 such as
// Tasty's). Rather than bundle a heavyweight inline player (react-native-webview
// / expo-video are NOT installed and would force a dev-client rebuild), we open
// the video in the OS browser via Linking.openURL — the exact pattern already
// used by AmazonAffiliateButton. When there is no usable video, the component
// renders nothing (returns null), so callers can drop it inline unconditionally.

import React from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { resolveVideoUrl, isYouTubeUrl } from '../../modules/recipeVideo';

/**
 * @param {object} props
 * @param {string|null|undefined} props.videoUrl - raw videoUrl from the recipe.
 */
export default function RecipeVideoButton({ videoUrl }) {
  const css = useTheme();
  const t = useT();

  const url = resolveVideoUrl({ videoUrl });
  if (!url) return null;

  const youtube = isYouTubeUrl(url);
  const label = youtube
    ? t('recipe.video.watchOnYoutube')
    : t('recipe.video.watch');

  const handlePress = () => {
    // `.catch` so a denied URL scheme (no installed browser) can't crash the
    // screen — same guard as AmazonAffiliateButton.
    Linking.openURL(url).catch((err) =>
      console.warn('[RecipeVideoButton] Failed to open:', err),
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={t('recipe.video.hint')}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: css.palette.primary600,
          borderRadius: css.radius.pill,
          paddingHorizontal: css.spacing.md,
          paddingVertical: css.spacing.sm,
          gap: css.spacing.sm,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <FontAwesome name="play-circle" size={18} color="white" />
      <Text
        style={[
          styles.text,
          {
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.bodySize,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    minHeight: 44, // a11y touch target
  },
  text: {
    color: 'white',
    fontWeight: '600',
  },
});
