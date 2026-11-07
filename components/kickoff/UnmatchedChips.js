// UnmatchedChips — names a photo analysis saw but the catalog does not know
// (plan 015). Tapping a name opens the ingredient search with it typed in;
// the × dismisses it. Shown on Kickoff and Recap.
//
// Same family as the "SELECTED · N" row of Kickoff: same overline, compact
// dashed chips like its "+ Add" chip (not yet in the list).

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
// Root import as in components/inventory: lucide-react-native 1.14 exports no
// per-icon path yet (D17).
import { Search, X } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

/**
 * @param {{ names: string[], onSearch: (name: string) => void, onDismiss: (name: string) => void }} props
 */
export default function UnmatchedChips({ names = [], onSearch, onDismiss }) {
  const css = useTheme();
  const t = useT();
  if (names.length === 0) return null;

  return (
    <View style={[styles.container, { paddingHorizontal: css.spacing.md, paddingVertical: css.spacing.xs }]} testID="unmatched-chips">
      <Text
        style={[
          styles.label,
          {
            color: css.flow.label,
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.overlineSize,
            marginBottom: css.spacing.xs,
          },
        ]}
      >
        {t('kickoff.scan.unmatchedLabel', { count: names.length })}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: css.spacing.sm }}>
        {names.map((name) => (
          <View
            key={name}
            style={[styles.chip, { borderColor: css.flow.chipBorder, borderRadius: css.radius.pill }]}
          >
            <Pressable
              onPress={() => onSearch?.(name)}
              accessibilityRole="button"
              accessibilityLabel={t('kickoff.scan.searchA11y', { name })}
              // 30 pt drawn, 44 pt to touch.
              hitSlop={{ top: 7, bottom: 7 }}
              style={[styles.searchArea, { paddingLeft: css.spacing.sm, gap: css.spacing.xs }]}
            >
              <Search size={13} color={css.flow.chipText} />
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  { color: css.flow.chipText, fontFamily: css.typography.fontUI, fontSize: css.typography.captionSize + 1 },
                ]}
              >
                {name}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onDismiss?.(name)}
              accessibilityRole="button"
              accessibilityLabel={t('kickoff.scan.dismissA11y', { name })}
              hitSlop={{ top: 7, bottom: 7, left: 4, right: 9 }}
              style={styles.dismiss}
            >
              <X size={14} color={css.flow.chipText} />
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
  },
  label: {
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 30,
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
  },
  name: {
    maxWidth: 160,
    fontWeight: '700',
  },
  dismiss: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
