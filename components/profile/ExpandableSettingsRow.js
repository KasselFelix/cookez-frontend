// ExpandableSettingsRow
//
// Tappable settings row mirroring the visual contract of `SettingsRow`
// (icon · label · compact value · chevron) but with an inline expansion
// body rendered just below the row when `expanded === true`.
//
// Why inline expansion (and not a bottom sheet like the other rows):
//   The 3 Plan 003 preference editors (preferred tags / excluded tags /
//   excluded ingredients) are multi-select widgets with an integrated
//   search. A 90% bottom sheet would feel heavier than the editor itself
//   and break the scan-flow of the Settings screen. Inline expansion
//   preserves context while staying lightweight.
//
// Why **controlled** (state lifted to the parent):
//   The 3 rows in SettingsScreen behave as an exclusive accordion (only
//   one open at a time). Holding the expansion state inside each row
//   would force cross-row coordination via refs or context. Lifting the
//   state to the parent keeps the rule trivial and the component
//   stateless on expansion.
//
// Animations: Reanimated 4 (already in the project, used by HeroImage,
// StickyHeader, etc.). LayoutAnimation was avoided because of its known
// Android quirks (requires UIManager.setLayoutAnimationEnabledExperimental
// + the onComplete callback is unreliable). `LinearTransition` on the
// Animated.View body gives a fluid resize of the parent ScrollView for
// free.

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';

const CHEVRON_DURATION_MS = 200;

export default function ExpandableSettingsRow({
  icon,
  label,
  value,
  children,
  expanded,
  onToggle,
}) {
  const css = useTheme();
  const rotation = useSharedValue(expanded ? 90 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 90 : 0, {
      duration: CHEVRON_DURATION_MS,
    });
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const valueText =
    value === undefined || value === null || value === ''
      ? null
      : String(value);

  return (
    <Animated.View
      layout={LinearTransition.duration(CHEVRON_DURATION_MS)}
      style={{ backgroundColor: css.palette.surfaceCard }}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: !!expanded }}
        hitSlop={4}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: css.palette.surfaceCard,
            borderBottomColor: css.palette.neutral200,
          },
          pressed && { backgroundColor: css.palette.neutral100 },
        ]}
      >
        <View style={styles.iconWrap}>{icon}</View>
        <Text
          style={[
            styles.label,
            {
              color: css.palette.neutral900,
              fontFamily: css.typography.fontUI,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {valueText !== null ? (
          <Text
            style={[
              styles.value,
              {
                color: css.palette.neutral500,
                fontFamily: css.typography.fontUI,
              },
            ]}
            numberOfLines={1}
          >
            {valueText}
          </Text>
        ) : null}
        <Animated.View style={[styles.chevronWrap, chevronStyle]}>
          <ChevronRight size={18} color={css.palette.neutral500} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View
          layout={LinearTransition.duration(CHEVRON_DURATION_MS)}
          style={[
            styles.body,
            {
              backgroundColor: css.palette.surfaceCard,
              borderBottomColor: css.palette.neutral200,
              paddingHorizontal: css.spacing.md,
              paddingTop: css.spacing.sm,
              paddingBottom: css.spacing.md,
            },
          ]}
        >
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

export { ExpandableSettingsRow };

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
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
    fontSize: 14,
  },
  value: {
    fontSize: 12,
    marginLeft: 8,
  },
  chevronWrap: {
    marginLeft: 8,
  },
  body: {
    borderBottomWidth: 1,
  },
});
