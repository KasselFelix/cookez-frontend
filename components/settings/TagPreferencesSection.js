// TagPreferencesSection — settings block wrapping TagPreferencesEditor.
//
// This component is now a thin wrapper that renders a header + helper +
// the actual editor body (TagPreferencesEditor). The body was extracted
// so SettingsScreen can embed the editor inside ExpandableSettingsRow
// without dragging along this card's header.
//
// Kept for backwards compatibility in case any other screen still
// composes the full card variant. New code should prefer
// `<TagPreferencesEditor />` directly.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import TagPreferencesEditor from './TagPreferencesEditor';

export default function TagPreferencesSection({ variant, value = [], onChange }) {
  const css = useTheme();
  const t = useT();

  const titleKey =
    variant === 'preferred'
      ? 'settings.preferredTags.title'
      : 'settings.excludedTags.title';

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
        {t(titleKey)}
      </Text>
      <TagPreferencesEditor variant={variant} value={value} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  title: { marginBottom: 4 },
});
