// InventorySummaryRow — row of 4 mini-cards summarizing pantry health.
//
// Each card reuses MonoStat for the value+label rendering. Because MonoStat
// hardcodes the value text to `style.palette.neutral900`, we clone the
// theme object with that key overridden for the two coloured cards
// (expiringSoon = accent500, expired = palette.error). This keeps MonoStat
// untouched while letting the SummaryRow drive its colour palette.

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import MonoStat from '../profile/MonoStat';

export default function InventorySummaryRow({ summary }) {
  const css = useTheme();
  const t = useT();

  const safeSummary = {
    total: summary?.total ?? 0,
    expiringSoon: summary?.expiringSoon ?? 0,
    expired: summary?.expired ?? 0,
    lowStock: summary?.lowStock ?? 0,
  };

  // Clone the theme object and swap neutral900 (the colour MonoStat uses
  // for the value text) so the same component can render an accent / error
  // tinted value without forking MonoStat itself.
  const accentTheme = useMemo(
    () => ({ ...css, palette: { ...css.palette, neutral900: css.palette.accent500 } }),
    [css],
  );
  const errorTheme = useMemo(
    () => ({ ...css, palette: { ...css.palette, neutral900: css.palette.error } }),
    [css],
  );

  const cardStyle = [
    styles.card,
    css.shadow.sm,
    {
      backgroundColor: css.palette.surfaceCard,
      borderRadius: css.radius.md,
      padding: css.spacing.md,
    },
  ];

  return (
    <View
      style={[
        styles.row,
        { gap: css.spacing.sm, paddingHorizontal: css.spacing.md },
      ]}
      accessibilityLabel={t('profile.inventory.summary.total')}
    >
      <View style={cardStyle}>
        <MonoStat
          style={css}
          value={safeSummary.total}
          label={t('profile.inventory.summary.total')}
        />
      </View>
      <View style={cardStyle}>
        <MonoStat
          style={accentTheme}
          value={safeSummary.expiringSoon}
          label={t('profile.inventory.summary.expiring_soon')}
        />
      </View>
      <View style={cardStyle}>
        <MonoStat
          style={errorTheme}
          value={safeSummary.expired}
          label={t('profile.inventory.summary.expired')}
        />
      </View>
      <View style={cardStyle}>
        <MonoStat
          style={css}
          value={safeSummary.lowStock}
          label={t('profile.inventory.summary.low_stock')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { InventorySummaryRow };
