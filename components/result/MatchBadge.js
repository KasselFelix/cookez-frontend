import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

// Compact pill showing how much of the recipe the user already owns.
// The backend returns `matchRatio` as a 0-100 integer; we color-band it
// (≥80 primary, 40-79 secondary, <40 accent) so the user can scan a
// result list and triage by "easy to cook" vs "shopping required".
//
// Why skip render at ratio <= 0?
//   A zero-ownership badge is just visual noise — the recipe row should
//   stay compact when there's nothing to celebrate.
export default function MatchBadge({ ratio }) {
  const css = useTheme();
  const t = useT();

  if (ratio == null || ratio <= 0) return null;

  const bg =
    ratio >= 80
      ? css.palette.primary500
      : ratio >= 40
        ? css.palette.secondary500
        : css.palette.accent500;

  return (
    <View
      style={[styles.pill, { backgroundColor: bg }]}
      accessibilityLabel={t('result.matchBadge.a11y', { ratio })}
    >
      <FontAwesome name="shopping-basket" size={12} color="white" />
      <Text style={styles.text}>{t('result.matchBadge.label', { ratio })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 6,
  },
  text: { color: 'white', fontSize: 12, fontWeight: '600' },
});
