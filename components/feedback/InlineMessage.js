// InlineMessage — an error, info or warning shown where it happened: inside a
// native modal (a toast stays hidden under a <Modal>, a separate window) or
// under the field or button the user just touched (plan 020).
//
// It carries its own background (surfaceCard) and text colour (neutral900):
// some screens that host it (AddRecipeScreen, SignIn, SignUp) still use the
// fixed tokens of styles/Global, whose background does not follow the theme.
// Same colour rule as Toast: the semantic colour only on the icon and edge.

import React, { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import { TOAST_TYPES } from './Toast';

/**
 * Renders nothing while `message` is empty, so a screen can keep it mounted
 * and clear it by clearing its state.
 *
 * @param {{
 *   type?: 'error' | 'info' | 'warning',
 *   message?: string | null,
 *   testID?: string,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 * }} props
 */
export default function InlineMessage({ type = 'error', message, testID, style }) {
  const css = useTheme();
  const { Icon, color } = TOAST_TYPES[type] ?? TOAST_TYPES.error;
  const accent = css.palette[color];

  // iOS has no live region: announce each new message. Android reads the
  // live region below, so announcing there too would read it twice.
  useEffect(() => {
    if (message && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  if (!message) return null;

  return (
    <View
      testID={testID}
      accessibilityRole={type === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion={Platform.OS === 'android' ? 'polite' : undefined}
      style={[
        styles.box,
        {
          backgroundColor: css.palette.surfaceCard,
          borderColor: css.input.borderColor,
          borderLeftColor: accent,
          borderRadius: css.radius.md,
          paddingHorizontal: css.spacing.sm,
          paddingVertical: css.spacing.sm,
        },
        style,
      ]}
    >
      <View
        style={[styles.icon, { marginRight: css.spacing.sm }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Icon size={18} color={accent} strokeWidth={2.25} />
      </View>
      <Text
        style={[
          styles.text,
          {
            color: css.palette.neutral900,
            fontFamily: css.typography.fontBody,
            fontSize: css.typography.bodySmSize,
            lineHeight: css.typography.bodySmLine,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  icon: {
    paddingTop: 1,
  },
  text: {
    flex: 1,
  },
});
