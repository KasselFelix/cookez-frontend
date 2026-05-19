// ExcludedIngredientsSection — settings card wrapping ExcludedIngredientsEditor.
//
// This component is now a thin wrapper that renders a header + the
// actual editor body (ExcludedIngredientsEditor). The body was
// extracted so SettingsScreen can embed it inside an
// ExpandableSettingsRow without this card's header.
//
// Kept for backwards compatibility in case any other screen still
// composes the full card variant. New code should prefer
// `<ExcludedIngredientsEditor />` directly.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import ExcludedIngredientsEditor from './ExcludedIngredientsEditor';

export default function ExcludedIngredientsSection({ value = [], onChange }) {
  const css = useTheme();
  const t = useT();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: css.palette.surfaceCard,
          padding: css.spacing.md,
          borderRadius: css.radius.lg,
          marginBottom: css.spacing.md,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: css.palette.neutral900,
            fontFamily: css.typography.fontHeading,
            fontSize: css.typography.h4Size,
          },
        ]}
      >
        {t('settings.excludedIngredients.title')}
      </Text>
      <ExcludedIngredientsEditor value={value} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  title: { marginBottom: 4 },
});
