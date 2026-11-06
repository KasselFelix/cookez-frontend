// UnmatchedChips — names a photo analysis saw but the catalog does not know
// (plan 015). Tapping a name opens the ingredient search with it typed in;
// the × dismisses it. Shown on Kickoff and Recap.

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
// Root import as in components/inventory: lucide-react-native 1.14 exports no
// per-icon path yet (D17).
import { Search, X } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

/**
 * @param {{ names: string[], onSearch: (name: string) => void, onDismiss: (name: string) => void, labelColor?: string }} props
 *   `labelColor` for a screen whose background does not follow the theme.
 */
export default function UnmatchedChips({ names = [], onSearch, onDismiss, labelColor }) {
  const css = useTheme();
  const t = useT();
  if (names.length === 0) return null;

  return (
    <View style={[styles.container, { paddingHorizontal: css.spacing.md }]} testID="unmatched-chips">
      <Text
        style={[
          styles.label,
          {
            color: labelColor || css.palette.primary800,
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.overlineSize,
            marginBottom: css.spacing.xs,
          },
        ]}
      >
        {t('kickoff.scan.unmatchedLabel')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: css.spacing.sm }}>
        {names.map((name) => (
          <View
            key={name}
            style={[
              styles.chip,
              {
                backgroundColor: css.palette.surfaceCard,
                borderColor: css.palette.primary400,
                borderRadius: css.radius.pill,
              },
            ]}
          >
            <Pressable
              onPress={() => onSearch?.(name)}
              accessibilityRole="button"
              accessibilityLabel={t('kickoff.scan.searchA11y', { name })}
              style={[styles.searchArea, { paddingLeft: css.spacing.md, gap: css.spacing.xs }]}
            >
              <Search size={16} color={css.palette.primary800} />
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  { color: css.palette.primary800, fontFamily: css.typography.fontUI, fontSize: css.typography.bodySmSize },
                ]}
              >
                {name}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onDismiss?.(name)}
              accessibilityRole="button"
              accessibilityLabel={t('kickoff.scan.dismissA11y', { name })}
              style={styles.dismiss}
            >
              <X size={16} color={css.palette.neutral700} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 44,
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  name: {
    maxWidth: 160,
    fontWeight: '700',
  },
  dismiss: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
