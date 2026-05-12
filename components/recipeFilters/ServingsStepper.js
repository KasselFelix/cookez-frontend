// ServingsStepper — pair of round buttons around a numeric readout.
//
// The recap screen needs a control that nudges the serving count for the
// next /recipes/result call. We deliberately keep `value` nullable so the
// parent can express "no override yet — use backend default" by passing
// null; the readout falls back to an em-dash so the UI never lies about
// the current state.
//
// Haptics fire on every press (selectionAsync) — they're swallowed
// silently if the OS denies the call. The +/- buttons themselves are
// 44×44 to clear the iOS HIG touch target floor.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export default function ServingsStepper({
  value,
  min = 1,
  max = 12,
  onIncrement,
  onDecrement,
}) {
  const css = useTheme();
  const t = useT();

  const display = value ?? '—';
  const decrementDisabled = value != null && value <= min;
  const incrementDisabled = value != null && value >= max;

  const triggerHaptic = () => {
    Haptics.selectionAsync().catch(() => {});
  };

  const handleDecrement = () => {
    if (decrementDisabled) return;
    triggerHaptic();
    onDecrement?.();
  };

  const handleIncrement = () => {
    if (incrementDisabled) return;
    triggerHaptic();
    onIncrement?.();
  };

  return (
    <View style={[styles.row, { gap: css.spacing.md }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('recipe.servings.decrement')}
        accessibilityState={{ disabled: decrementDisabled }}
        onPress={handleDecrement}
        disabled={decrementDisabled}
        hitSlop={10}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: css.palette.secondary500,
            opacity: decrementDisabled ? 0.4 : pressed ? 0.7 : 1,
          },
        ]}
      >
        <FontAwesome name="minus" size={16} color={css.palette.primary900} />
      </Pressable>

      <Text
        style={{
          fontFamily: css.typography.fontDisplay,
          fontSize: css.typography.h3Size,
          color: css.palette.neutral900,
          minWidth: 32,
          textAlign: 'center',
        }}
        accessibilityLiveRegion="polite"
        accessibilityLabel={
          value == null
            ? t('recipe.servings.label')
            : `${t('recipe.servings.label')}: ${value}`
        }
      >
        {display}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('recipe.servings.increment')}
        accessibilityState={{ disabled: incrementDisabled }}
        onPress={handleIncrement}
        disabled={incrementDisabled}
        hitSlop={10}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: css.palette.secondary500,
            opacity: incrementDisabled ? 0.4 : pressed ? 0.7 : 1,
          },
        ]}
      >
        <FontAwesome name="plus" size={16} color={css.palette.primary900} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
