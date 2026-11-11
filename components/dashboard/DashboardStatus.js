// DashboardStatus — what the Dashboard shows instead of its list: the
// catalog is loading, failed to load, or the database has no recipe.
// FontAwesome stays until the Lucide migration (plan 018, step 4).
import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export function DashboardLoading() {
  const css = useTheme();
  const t = useT();
  return (
    <View style={[styles.centered, { backgroundColor: css.palette.surface }]}>
      <ActivityIndicator
        size="large"
        color={css.palette.primary500}
        accessibilityLabel={t('userDashboard.loadingA11y')}
      />
      <Text
        style={{
          marginTop: css.spacing.md,
          fontFamily: css.typography.fontBody,
          fontSize: css.typography.bodySize,
          color: css.palette.neutral500,
        }}
      >
        {t('userDashboard.loading')}
      </Text>
    </View>
  );
}

/**
 * Icon, title, subtitle and one call to action.
 *
 * @param {{
 *   icon: string,
 *   title: string,
 *   subtitle: string,
 *   ctaLabel: string,
 *   ctaA11y: string,
 *   onPress: () => void,
 * }} props
 */
function DashboardMessage({ icon, title, subtitle, ctaLabel, ctaA11y, onPress }) {
  const css = useTheme();
  return (
    <View
      style={[
        styles.centered,
        { backgroundColor: css.palette.surface, paddingHorizontal: css.spacing.xl },
      ]}
    >
      <FontAwesome name={icon} size={48} color={css.palette.neutral300} />
      <Text
        style={{
          marginTop: css.spacing.md,
          fontFamily: css.typography.fontHeading,
          fontSize: css.typography.h3Size,
          color: css.palette.neutral900,
        }}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            marginTop: css.spacing.xs,
            fontFamily: css.typography.fontBody,
            fontSize: css.typography.bodySize,
            color: css.palette.neutral500,
          },
        ]}
      >
        {subtitle}
      </Text>
      <TouchableOpacity
        style={{
          marginTop: css.spacing.lg,
          backgroundColor: css.palette.primary800,
          paddingVertical: css.button.primaryPaddingV,
          paddingHorizontal: css.button.primaryPaddingH,
          borderRadius: css.radius.pill,
        }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={ctaA11y}
      >
        <Text
          style={[
            styles.ctaText,
            {
              fontFamily: css.typography.fontUI,
              fontSize: css.typography.bodySize,
              color: css.palette.white,
            },
          ]}
        >
          {ctaLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/** The catalog failed to load and nothing is cached. */
export function DashboardLoadError({ onRetry }) {
  const t = useT();
  return (
    <DashboardMessage
      icon="exclamation-triangle"
      title={t('userDashboard.error.title')}
      subtitle={t('userDashboard.error.subtitle')}
      ctaLabel={t('common.retry')}
      ctaA11y={t('userDashboard.error.retryA11y')}
      onPress={onRetry}
    />
  );
}

/** The catalog loaded and the database has no recipe. */
export function DashboardEmpty({ onAddRecipe }) {
  const t = useT();
  return (
    <DashboardMessage
      icon="cutlery"
      title={t('userDashboard.empty.title')}
      subtitle={t('userDashboard.empty.subtitle')}
      ctaLabel={t('userDashboard.empty.addCta')}
      ctaA11y={t('userDashboard.empty.addCtaA11y')}
      onPress={onAddRecipe}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  ctaText: {
    fontWeight: '600',
  },
});
