// ProfileImpactStats — placeholder card for the "Impact" panel.
//
// Why a stub? See plan 001: real metrics need a `cookedLog` collection
// + seasonal tags on ingredients. This component documents the shape
// the future data will take and gives the Profile screen a reserved
// vertical slot, so the eventual wiring is a content swap, not a
// layout reflow.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export default function ProfileImpactStats() {
  const css = useTheme();
  const t = useT();

  const items = [
    { key: 'seasonal', value: '0%' },
    { key: 'cooked', value: '0' },
    { key: 'seasonalIngredients', value: '0' },
  ];

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: css.palette.surfaceCard,
          borderColor: css.palette.neutral200,
          borderRadius: css.radius.md,
          padding: css.spacing.md,
          marginHorizontal: css.spacing.md,
          marginBottom: css.spacing.md,
        },
      ]}
      accessibilityLabel={t('profile.impactStats.title')}
    >
      <Text
        style={{
          fontFamily: css.typography.fontUI,
          fontSize: css.typography.h6Size,
          lineHeight: css.typography.h6Line,
          color: css.palette.neutral500,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: css.spacing.cardGap,
        }}
      >
        {t('profile.impactStats.title')}
      </Text>
      <View style={styles.row}>
        {items.map(({ key, value }) => (
          <View key={key} style={styles.col}>
            <Text
              style={{
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h3Size,
                lineHeight: css.typography.h3Line,
                color: css.palette.neutral900,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {value}
            </Text>
            <Text
              style={{
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.h6Size,
                lineHeight: css.typography.h6Line,
                color: css.palette.neutral500,
                textAlign: 'center',
                marginTop: 4,
              }}
              numberOfLines={2}
            >
              {t(`profile.impactStats.${key}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    paddingHorizontal: 4,
  },
});

export { ProfileImpactStats };
