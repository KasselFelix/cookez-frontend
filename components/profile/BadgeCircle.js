import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';

/**
 * BadgeCircle
 * Bordered circular icon with caption label below (used in profile badges row
 * and the empty pantry state). Colors follow the active theme (plan 017).
 *
 * Props:
 *  - icon  (node)   — lucide icon element
 *  - label (string) — caption text
 *  - size  (number) — outer circle diameter (default 42)
 */
export default function BadgeCircle({ icon, label, size = 42 }) {
  const css = useTheme();
  return (
    <View style={styles.container} accessible accessibilityLabel={label}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: css.palette.neutral900,
            backgroundColor: css.palette.surfaceCard,
          },
        ]}
      >
        {icon}
      </View>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              fontFamily: css.typography.fontUI,
              fontSize: css.typography.overlineSize,
              color: css.palette.neutral500,
              marginTop: css.spacing.xs,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});

export { BadgeCircle };
