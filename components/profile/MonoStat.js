import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';

// Shared monospace family for numeric stats / placeholder labels.
export const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/**
 * MonoStat
 * Single numeric stat cell — value on top, label below, both monospaced.
 *
 * Props:
 *  - value: string | number
 *  - label: string
 *  - valueColor: optional palette colour override for the value text
 *    (lets callers tint a single cell — e.g. accent for "expiring soon",
 *     error for "expired" — without forking the component).
 *  - labelColor: optional palette colour override for the label text.
 */
export default function MonoStat({ value, label, valueColor, labelColor }) {
  const css = useTheme();
  return (
    <View style={styles.container}>
      <Text
        style={[styles.value, { color: valueColor ?? css.palette.neutral900 }]}
        numberOfLines={1}
        accessibilityRole="text"
      >
        {String(value)}
      </Text>
      <Text
        style={[styles.label, { color: labelColor ?? css.palette.neutral500 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: MONO_FONT,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
});

export { MonoStat };
