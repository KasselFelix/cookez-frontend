// CategoryFilterBar — the horizontal chips All, Quick, Vegan, Dessert, Trending.
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { DASHBOARD_FILTERS } from '../../modules/dashboardFilters';

/**
 * @param {{ activeFilter: string, onSelect: (filter: string) => void }} props
 */
export default function CategoryFilterBar({ activeFilter, onSelect }) {
  const css = useTheme();
  const t = useT();

  return (
    <View style={{ marginTop: css.spacing.lg }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: css.spacing.md, gap: css.spacing.sm }}
      >
        {DASHBOARD_FILTERS.map((filter) => {
          const isActive = filter === activeFilter;
          const label = t(`userDashboard.filters.${filter.toLowerCase()}`);
          return (
            <TouchableOpacity
              key={filter}
              style={{
                paddingVertical: css.spacing.sm,
                paddingHorizontal: css.spacing.md,
                borderRadius: css.radius.pill,
                backgroundColor: isActive ? css.pill.bgSelected : css.pill.bgNeutral,
              }}
              onPress={() => onSelect(filter)}
              accessibilityRole="button"
              accessibilityLabel={t('userDashboard.filterA11y', { filter: label })}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    fontFamily: css.typography.fontUI,
                    fontSize: css.typography.h5Size,
                    color: isActive ? css.pill.textSelected : css.pill.textNeutral,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chipText: {
    fontWeight: '500',
  },
});
