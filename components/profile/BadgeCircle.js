import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import css from '../../styles/Global';

/**
 * BadgeCircle
 * Bordered circular icon with caption label below (used in profile badges row).
 *
 * Props:
 *  - icon  (node)   — lucide icon element
 *  - label (string) — caption text
 *  - size  (number) — outer circle diameter (default 42)
 */
export default function BadgeCircle({ icon, label, size = 42 }) {
  return (
    <View style={styles.container} accessible accessibilityLabel={label}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {icon}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    borderWidth: 1.5,
    borderColor: css.palette.neutral900,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: css.palette.white,
  },
  label: {
    fontFamily: css.typography.fontUI,
    fontSize: 9,
    color: css.palette.neutral500,
    marginTop: 4,
    textAlign: 'center',
  },
});

export { BadgeCircle };
