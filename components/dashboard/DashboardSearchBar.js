// DashboardSearchBar — search field and the filters button with its count.
// FontAwesome stays until the Lucide migration (plan 018, step 4).
import { FontAwesome } from '@expo/vector-icons';
import { SlidersHorizontal } from 'lucide-react-native';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

/**
 * @param {{
 *   query: string,
 *   onChangeQuery: (text: string) => void,
 *   activeFiltersCount: number,
 *   onOpenFilters: () => void,
 * }} props
 */
export default function DashboardSearchBar({ query, onChangeQuery, activeFiltersCount, onOpenFilters }) {
  const css = useTheme();
  const t = useT();
  const hasFilters = activeFiltersCount > 0;

  return (
    <View
      style={[
        styles.row,
        { marginTop: css.spacing.lg, marginHorizontal: css.spacing.md, gap: css.spacing.sm },
      ]}
    >
      <View
        style={[
          styles.field,
          {
            paddingHorizontal: css.spacing.md,
            paddingVertical: css.spacing.sm,
            backgroundColor: css.palette.surfaceCard,
            borderRadius: css.radius.pill,
          },
          css.shadow.sm,
        ]}
      >
        <FontAwesome
          name="search"
          size={16}
          color={css.palette.neutral500}
          style={{ marginRight: css.spacing.sm }}
        />
        <TextInput
          style={[
            styles.input,
            {
              fontFamily: css.typography.fontBody,
              fontSize: css.typography.bodySize,
              color: css.palette.neutral900,
            },
          ]}
          placeholder={t('userDashboard.searchPlaceholder')}
          placeholderTextColor={css.palette.neutral500}
          value={query}
          onChangeText={onChangeQuery}
          returnKeyType="search"
          accessibilityLabel={t('userDashboard.searchPlaceholder')}
          autoCorrect={false}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.filtersButton,
          { backgroundColor: hasFilters ? css.palette.primary800 : css.palette.surfaceCard },
          css.shadow.sm,
        ]}
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel={t('userDashboard.filtersButton.a11y')}
      >
        <SlidersHorizontal
          size={20}
          color={hasFilters ? css.palette.white : css.palette.neutral700}
        />
        {hasFilters && (
          <View
            style={[
              styles.badge,
              { backgroundColor: css.palette.error, borderColor: css.palette.surface },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: css.palette.white, fontFamily: css.typography.fontUI },
              ]}
            >
              {activeFiltersCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  filtersButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
