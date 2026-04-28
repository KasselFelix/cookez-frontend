import React from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import css from '../../styles/Global';

/**
 * FloatingFAB
 * Bottom-right floating action button — primary entry point to comment composer.
 */
export default function FloatingFAB({ onPress, accessibilityLabel = 'Add a comment' }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <FontAwesome name="plus" size={24} color={css.palette.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: css.spacing.lg,
    bottom: Platform.OS === 'ios' ? css.spacing.xl : css.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: css.radius.pill,
    backgroundColor: css.palette.primary800,
    alignItems: 'center',
    justifyContent: 'center',
    ...css.shadow.lg,
  },
});
