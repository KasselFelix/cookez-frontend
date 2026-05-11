import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import css from '../../styles/Global';

// Shared monospace family for numeric stats / placeholder labels.
export const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export default function MonoStat({ value, label, style }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.value,{color: style.palette.neutral900}]} numberOfLines={1} accessibilityRole="text">
        {String(value)}
      </Text>
      <Text style={[styles.label,{color: style.palette.neutral500}]} numberOfLines={1}>
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
