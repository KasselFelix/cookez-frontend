// ScanSummary — on Recap, the photo analyses still running and the failed ones
// (plan 015: "Next" never waits), then the names nobody recognized. A name
// sends the user back to Kickoff with the search opened on it.

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { removeUnmatched, requestSearch } from '../../reducers/scan';
import UnmatchedChips from '../kickoff/UnmatchedChips';

/**
 * @param {{ onSearch: () => void }} props `onSearch` runs after the search is
 *   requested, to bring Kickoff back.
 */
export default function ScanSummary({ onSearch }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const { photos, unmatched } = useSelector((state) => state.scan.value);

  const pending = photos.filter((photo) => photo.status === 'pending').length;
  const failed = photos.filter((photo) => photo.status === 'error' || photo.status === 'quota' || photo.status === 'signedOut').length;
  if (pending === 0 && failed === 0 && unmatched.length === 0) return null;

  const lineStyle = {
    color: css.palette.neutral700,
    fontFamily: css.typography.fontBody,
    fontSize: css.typography.bodySmSize,
  };

  return (
    <View style={[styles.container, { gap: css.spacing.xs, marginBottom: css.spacing.sm }]} testID="scan-summary">
      {pending > 0 && (
        <View style={[styles.line, { gap: css.spacing.sm, paddingHorizontal: css.spacing.md }]} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={css.palette.primary800} />
          <Text style={lineStyle}>{t('recap.scan.pending', { count: pending })}</Text>
        </View>
      )}
      {failed > 0 && (
        <Text style={[lineStyle, { paddingHorizontal: css.spacing.md, color: css.palette.error }]}>
          {t('recap.scan.failed', { count: failed })}
        </Text>
      )}
      <UnmatchedChips
        names={unmatched}
        onSearch={(name) => {
          dispatch(removeUnmatched(name));
          dispatch(requestSearch(name));
          onSearch?.();
        }}
        onDismiss={(name) => dispatch(removeUnmatched(name))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
