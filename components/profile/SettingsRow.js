import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import css from '../../styles/Global';
import { useTheme } from '../../contexts/ThemeProvider';

/**
 * SettingsRow
 * Tappable list row used inside SettingsScreen sections.
 *
 * Props:
 *  - icon    (node)   — lucide icon element (already sized)
 *  - label   (string) — primary label text
 *  - value   (string) — optional right-aligned value
 *  - onPress (func)   — required interaction
 *  - danger  (bool)   — switches color tokens to error red, hides chevron
 */
export default function SettingsRow({ icon, label, value, onPress, danger = false }) {
  const css = useTheme();
  const labelColor = danger ? css.palette.error : css.palette.neutral900;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => 
        [[styles.row, 
        { backgroundColor: css.palette.surfaceCard,borderBottomColor: css.palette.neutral200, }], 
        pressed && { backgroundColor: css.palette.neutral100 }]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.value,{ color: css.palette.neutral500 }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {!danger ? (
        <View style={styles.chevronWrap}>
          <ChevronRight size={18} color={css.palette.neutral500} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: css.palette.neutral200,
    minHeight: 52,
  },
  iconWrap: {
    marginRight: 14,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: css.typography.fontUI,
    fontSize: 14,
  },
  value: {
    fontFamily: css.typography.fontUI,
    fontSize: 12,
    marginLeft: 8,
  },
  chevronWrap: {
    marginLeft: 8,
  },
});

export { SettingsRow };
