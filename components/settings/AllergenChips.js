// AllergenChips — multi-select of the regulated allergens in the allergies modal.
// `value` holds the selected keys; `onChange` receives a new array.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { ALLERGEN_KEYS } from '../../modules/allergenOptions';

export default function AllergenChips({ value = [], onChange }) {
  const css = useTheme();
  const t = useT();

  const toggle = (key) => {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  };

  return (
    <View style={styles.wrap} accessibilityRole="list">
      {ALLERGEN_KEYS.map((key) => {
        const selected = value.includes(key);
        const label = t(`settings.allergens.${key}`);
        return (
          <TouchableOpacity
            key={key}
            onPress={() => toggle(key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={label}
            style={[
              styles.chip,
              {
                borderRadius: css.radius.pill,
                borderColor: selected ? css.palette.neutral900 : css.palette.neutral300,
                backgroundColor: selected ? css.palette.neutral900 : css.palette.surface,
                paddingHorizontal: css.spacing.cardGap,
                marginRight: css.spacing.xs,
                marginBottom: css.spacing.xs,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.bodySmSize,
                lineHeight: css.typography.bodySmLine,
                color: selected ? css.palette.white : css.palette.neutral900,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1,
  },
});
