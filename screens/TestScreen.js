// Dev-only screen — playground for visualizing/iterating UI components.
// Accessible via the "TEST" button on HomeScreen.

import { View, Text } from 'react-native';

import { useTheme } from '../contexts/ThemeProvider';

export default function TestScreen() {
  const css = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: css.palette.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: css.spacing.lg,
      }}
    >
      <Text
        style={{
          fontFamily: css.typography.fontHeading,
          fontSize: css.typography.h3Size,
          color: css.palette.neutral900,
        }}
      >
        Test Screen
      </Text>
    </View>
  );
}
