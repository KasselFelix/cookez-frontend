// Dev-only screen — playground for visualizing/iterating UI components.
// Shown first in the dev gallery (TEST button on HomeScreen).
//
// Current content (2026-11-07): the scan pieces of Kickoff and Recap on the
// flow background of the active theme — the remove badge on photos, and the
// "not recognized" row. Data is invented; nothing calls the API.

import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../contexts/ThemeProvider';
import RemoveBadge from '../components/kickoff/RemoveBadge';
import UnmatchedChips from '../components/kickoff/UnmatchedChips';

const PHOTOS = [require('../assets/recipe/ratatouille.jpg'), require('../assets/recipe/croissant.jpg')];
const SAMPLE_UNMATCHED = ['yuzu kosho', 'shiso'];

export default function TestScreen() {
  const css = useTheme();
  return (
    <View
      testID="test-screen"
      style={{ backgroundColor: css.palette.flowBackground, paddingVertical: css.spacing.md, gap: css.spacing.md }}
    >
      <View testID="sandbox-badges" style={[styles.row, { gap: css.spacing.sm, paddingHorizontal: css.spacing.md }]}>
        {PHOTOS.map((source, index) => (
          <View key={index} style={[styles.photo, { borderRadius: css.radius.lg }]}>
            <Image source={source} style={styles.photoImage} resizeMode="cover" />
            <RemoveBadge onPress={() => {}} accessibilityLabel="Remove" style={[styles.badge, { top: css.spacing.sm, right: css.spacing.sm }]} />
          </View>
        ))}
      </View>
      <UnmatchedChips names={SAMPLE_UNMATCHED} onSearch={() => {}} onDismiss={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  photo: { width: 120, height: 120, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute' },
});
