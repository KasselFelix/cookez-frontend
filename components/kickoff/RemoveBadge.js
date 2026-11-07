// RemoveBadge — the × that removes an ingredient or a photo, drawn on its
// photo (Kickoff slots, Recap cards). A rounded amber square keeps it readable
// on any photo; primary900 stays dark in every theme (6.8:1 or more on accent500).

import { Pressable, StyleSheet } from 'react-native';
// Root import as in components/kickoff/UnmatchedChips (D17).
import { X } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';

/**
 * @param {{ onPress: () => void, accessibilityLabel: string, testID?: string, style?: object }} props
 */
export default function RemoveBadge({ onPress, accessibilityLabel, testID, style }) {
  const css = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      // 26 pt drawn, 44 pt to touch.
      hitSlop={9}
      style={({ pressed }) => [
        styles.badge,
        {
          backgroundColor: css.palette.accent500,
          borderRadius: css.radius.sm,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <X size={16} strokeWidth={3} color={css.palette.primary900} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
