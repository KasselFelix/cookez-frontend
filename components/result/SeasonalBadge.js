import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

// Marker pill rendered next to MatchBadge when the backend flags a
// recipe as in-season for the user's region. Always renders when shown
// (no ratio gating like MatchBadge) — the parent decides whether to
// mount it based on `recipe.isSeasonal`.
export default function SeasonalBadge() {
  const css = useTheme();
  const t = useT();

  return (
    <View
      style={[styles.pill, { backgroundColor: css.palette.success || '#2E8B57' }]}
    >
      <FontAwesome name="leaf" size={12} color="white" />
      <Text style={styles.text}>{t('result.seasonalBadge.label')}</Text>
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
