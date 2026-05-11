// InventoryFilterChips — single-select horizontal chip rail.
//
// Tapping the active chip again deselects (active=null === "all").
// Parent owns the active state; this component is stateless.

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import PillChip from '../profile/PillChip';

export default function InventoryFilterChips({ active, onChange, categories }) {
  const css = useTheme();

  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        {
          gap: css.spacing.xs,
          paddingHorizontal: css.spacing.md,
          paddingVertical: css.spacing.xs,
        },
      ]}
    >
      {categories.map((c) => {
        const isActive = active === c.key;
        return (
          <View key={c.key}>
            <PillChip
              active={isActive}
              icon={c.icon}
              onPress={() => onChange(isActive ? null : c.key)}
            >
              {c.label}
            </PillChip>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export { InventoryFilterChips };
