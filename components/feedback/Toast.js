// Toast — a non-blocking message (success, info, recoverable error), drawn
// only: ToastProvider owns the timer, the animation and the announcement
// (plan 020).
//
// Text in neutral900 on surfaceCard, the pair of cards and modals, legible in
// the five themes. The semantic colours (identical in every theme) fail as
// text on white or on their *Bg tints, so they only colour the icon and the
// left edge; the icon is decorative, the text carries the meaning.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// Root import like the other Lucide files: lucide-react-native 1.14 exports no
// per-icon path (plan 018, step 3).
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

/** Icon and accent colour key of each message type. */
export const TOAST_TYPES = {
  success: { Icon: CircleCheck, color: 'success' },
  info: { Icon: Info, color: 'primary600' },
  warning: { Icon: TriangleAlert, color: 'warning' },
  error: { Icon: CircleAlert, color: 'error' },
};

/**
 * @param {{
 *   type?: 'success' | 'info' | 'warning' | 'error',
 *   title?: string,
 *   message: string,
 *   onClose?: () => void,
 *   testID?: string,
 * }} props
 */
export default function Toast({ type = 'info', title, message, onClose, testID }) {
  const css = useTheme();
  const t = useT();
  const { Icon, color } = TOAST_TYPES[type] ?? TOAST_TYPES.info;
  const accent = css.palette[color];

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        css.shadow.heavy,
        {
          backgroundColor: css.palette.surfaceCard,
          borderRadius: css.radius.lg,
          borderLeftColor: accent,
          paddingLeft: css.spacing.md,
          paddingVertical: css.spacing.sm,
        },
      ]}
    >
      <View
        style={[styles.icon, { marginRight: css.spacing.sm }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Icon size={22} color={accent} strokeWidth={2.25} />
      </View>
      <View style={[styles.body, { paddingVertical: css.spacing.xs }]}>
        {title ? (
          <Text
            style={{
              color: css.palette.neutral900,
              fontFamily: css.typography.fontHeading,
              fontSize: css.typography.bodySize,
              lineHeight: css.typography.bodyLine,
            }}
          >
            {title}
          </Text>
        ) : null}
        <Text
          style={{
            color: title ? css.palette.neutral700 : css.palette.neutral900,
            fontFamily: css.typography.fontBody,
            fontSize: title ? css.typography.bodySmSize : css.typography.bodySize,
            lineHeight: title ? css.typography.bodySmLine : css.typography.bodyLine,
          }}
        >
          {message}
        </Text>
      </View>
      {onClose ? (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={4}
          style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
        >
          <X size={20} color={css.palette.neutral700} />
        </Pressable>
      ) : (
        <View style={{ width: css.spacing.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  icon: {
    alignSelf: 'flex-start',
    paddingTop: 6,
  },
  body: {
    flex: 1,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
