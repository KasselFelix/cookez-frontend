// Dev-only screen — playground for visualizing/iterating UI components.
// Accessible via the "TEST" button on HomeScreen.

import { Text, View } from 'react-native';

import { useTheme } from '../contexts/ThemeProvider';

export default function TestScreen() {
  const css = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: css.palette.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: css.palette.neutral900, fontSize: 18 }}>Test Screen</Text>
    </View>
  );
}
