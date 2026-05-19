// TagPreferencesEditor — body-only chip multi-select for tag preferences.
//
// Extracted from TagPreferencesSection so the editor body (helper +
// chips) can be embedded inside an ExpandableSettingsRow without the
// section's own header (which the row already provides).
//
// Two variants:
//   - "preferred": tags the user wants surfaced more (positive signal)
//   - "excluded":  tags the user wants ranked lower (soft negative signal,
//                  not a hard filter — Excluded INGREDIENTS are the hard
//                  filter; tag exclusions only re-rank)
//
// Toggle = add if absent, remove if present. We never mutate `value`
// in-place because callers read it straight from redux state which must
// stay immutable.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import TagsMultiSelect from '../recipeFilters/TagsMultiSelect';

export default function TagPreferencesEditor({
  variant,
  value = [],
  onChange,
  showHelper = true,
}) {
  const css = useTheme();
  const t = useT();

  const helperKey =
    variant === 'preferred'
      ? 'settings.preferredTags.helper'
      : 'settings.excludedTags.helper';

  const handleToggle = (tag) => {
    const next = value.includes(tag)
      ? value.filter((x) => x !== tag)
      : [...value, tag];
    onChange?.(next);
  };

  return (
    <View style={styles.wrap}>
      {showHelper ? (
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
      ) : null}
      <TagsMultiSelect value={value} onToggle={handleToggle} />
    </View>
  );
}

export { TagPreferencesEditor };

const styles = StyleSheet.create({
  wrap: {},
  helper: { fontSize: 13, marginBottom: 12 },
});
