// InventorySummaryRow — 2x2 grid of mini-cards summarizing pantry health.
//
// 4 cards in a single row clipped the French labels (BIENT… / PÉRIM… /
// STOCK…) at 360pt viewports. The 2x2 grid gives each card ~155pt of
// inner width — enough to fit the longest label uncropped while letting
// the orange + red pair land together on the second row, which doubles
// as a visual "needs attention" cluster.
//
// Each card reuses MonoStat. MonoStat exposes a `valueColor` prop so we can
// tint the two attention cells (expiringSoon = accent500, expired = error)
// without forking the component or doing theme cloning.

import React from 'react';
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

  const cardStyle = [
    styles.card,
    css.shadow.sm,
    {
      backgroundColor: css.palette.surfaceCard,
      borderRadius: css.radius.md,
      padding: css.spacing.md,
    },
  ];

  // One entry per card. The order is deliberate: top row is informational
  // baseline, bottom row groups the two attention-demanding cells.
  const cards = [
    {
      key: 'total',
      value: safeSummary.total,
      label: t('profile.inventory.summary.total'),
    },
    {
      key: 'low_stock',
      value: safeSummary.lowStock,
      label: t('profile.inventory.summary.low_stock'),
    },
    {
      key: 'expiring_soon',
      value: safeSummary.expiringSoon,
      label: t('profile.inventory.summary.expiring_soon'),
      valueColor: css.palette.accent500,
    },
    {
      key: 'expired',
      value: safeSummary.expired,
      label: t('profile.inventory.summary.expired'),
      valueColor: css.palette.error,
    },
  ];

  return (
    <View
      style={[
        styles.grid,
        { gap: css.spacing.sm, paddingHorizontal: css.spacing.md },
      ]}
    >
      {cards.map((c) => (
        <View
          key={c.key}
          style={cardStyle}
          accessibilityRole="text"
          // Per-card label so screen readers announce each cell distinctly,
          // e.g. "Bientôt périmés : 2". Without this, the parent View used
          // to swallow all four cards into a single "Total" announcement.
          accessibilityLabel={`${c.label} : ${c.value}`}
        >
          <MonoStat value={c.value} label={c.label} valueColor={c.valueColor} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    // 48% so two cards fit per row with the css.spacing.sm gap between them.
    flexBasis: '48%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { InventorySummaryRow };
