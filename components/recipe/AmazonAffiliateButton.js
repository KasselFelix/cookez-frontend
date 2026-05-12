// AmazonAffiliateButton — opens an Amazon search prefilled with the missing
// ingredient and our affiliate tag.
//
// Why resolve the locale through i18n's `resolveLocale`?
//   The `locale` slice stores a *mode* (`'system' | 'en' | 'fr'`) rather
//   than the resolved 2-letter code. Passing the raw mode to
//   buildAmazonUrl would mismatch its `locale === 'fr'` check and a French
//   user on `'system'` mode would land on amazon.com, losing the
//   affiliate revenue and serving an English store.
//
// The Linking.openURL call is wrapped in a `.catch` so a denied URL
// scheme (rare; only if the user has uninstalled all browsers) doesn't
// crash the screen.

import React from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { resolveLocale } from '../../i18n';
import { buildAmazonUrl } from '../../modules/amazonLink';

export default function AmazonAffiliateButton({ ingredientName, quantity, unit }) {
  const css = useTheme();
  const t = useT();

  // `state.locale.value = { lang: 'system' | 'en' | 'fr' }`.
  // Resolve to a 2-letter code so the URL builder picks the right TLD.
  const localeMode = useSelector((s) => s?.locale?.value?.lang ?? 'system');
  const locale = resolveLocale(localeMode);
  const amazonConfig = useSelector(
    (s) => s?.appConfig?.value?.amazonConfig
  );

  const handlePress = () => {
    const url = buildAmazonUrl({
      ingredientName,
      quantity,
      unit,
      locale,
      amazonConfig,
    });
    Linking.openURL(url).catch((err) =>
      console.warn('[AmazonAffiliateButton] Failed to open:', err)
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={t('recipe.shopping.buyOnAmazon.a11y', {
        name: ingredientName,
      })}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: css.palette.accent500,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <FontAwesome name="shopping-cart" size={14} color="white" />
      <Text style={styles.text}>
        {t('recipe.shopping.buyOnAmazon.label')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  text: { color: 'white', fontWeight: '600', fontSize: 13 },
});
