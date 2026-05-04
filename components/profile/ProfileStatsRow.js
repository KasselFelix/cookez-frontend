import React from 'react';
import { StyleSheet, View } from 'react-native';

import css from '../../styles/Global';
import MonoStat from './MonoStat';

/**
 * ProfileStatsRow
 * Renders an evenly-distributed row of MonoStat items separated by thin
 * vertical dividers. Used by ProfileScreen and PublicProfileScreen.
 *
 * Props:
 *  - stats: Array<{ value: string|number, label: string, key?: string }>
 *  - style: optional ViewStyle
 *
 * Notes:
 *  - Each item flexes equally (MonoStat uses flex:1 internally).
 *  - Dividers are inserted between items, never on the outer edges.
 *  - Empty / undefined stats are filtered out so callers can pass conditional
 *    entries inline without `null` artefacts.
 */
export default function ProfileStatsRow({ stats, style }) {
  const items = (stats || []).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <View style={[styles.row, { backgroundColor: style.palette.surfaceCard }]} accessibilityRole="summary">
      {items.map((item, idx) => {
        const key = item.key || `${item.label}-${idx}`;
        return (
          <React.Fragment key={key}>
            <MonoStat value={item.value} label={item.label} style={style} />
            {idx < items.length - 1 ? <View style={styles.divider} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: css.spacing.md,
    paddingHorizontal: css.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: css.palette.neutral200,
  },
  divider: {
    width: 1,
    height: css.spacing.lg,
    backgroundColor: css.palette.neutral200,
  },
});

export { ProfileStatsRow };
