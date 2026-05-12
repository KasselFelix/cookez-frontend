// TagPreferencesSection — a settings block that wraps TagsMultiSelect.
//
// One component, two variants:
//   - "preferred": tags the user wants surfaced more (positive signal)
//   - "excluded":  tags the user wants ranked lower (soft negative signal,
//                  not a hard filter — Excluded INGREDIENTS are the hard
//                  filter; tag exclusions only re-rank)
//
// Both variants reuse the same chip multi-select UX so users get a
// consistent mental model: tap to add, tap an active chip to remove.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import TagsMultiSelect from '../recipeFilters/TagsMultiSelect';

export default function TagPreferencesSection({ variant, value = [], onChange }) {
  const css = useTheme();
  const t = useT();

  const titleKey =
    variant === 'preferred'
      ? 'settings.preferredTags.title'
      : 'settings.excludedTags.title';
  const helperKey =
    variant === 'preferred'
      ? 'settings.preferredTags.helper'
      : 'settings.excludedTags.helper';

  // Toggle = add if absent, remove if present. We never mutate `value`
  // in-place because callers (SettingsScreen) read it straight from
  // redux state which must stay immutable.
  const handleToggle = (tag) => {
    const next = value.includes(tag)
      ? value.filter((x) => x !== tag)
      : [...value, tag];
    onChange?.(next);
  };

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
      <Text
        style={[
          styles.helper,
          {
            color: css.palette.neutral700,
            fontFamily: css.typography.fontBody,
          },
        ]}
      >
        {t(helperKey)}
      </Text>
      <TagsMultiSelect value={value} onToggle={handleToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  title: { marginBottom: 4 },
  helper: { fontSize: 13, marginBottom: 12 },
});
