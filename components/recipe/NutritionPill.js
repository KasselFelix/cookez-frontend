// NutritionPill — compact, tappable pill in RecipeScreen's meta row that
// surfaces total calories for the *currently selected* serving count.
//
// Why a separate component (vs. inline in RecipeScreen)?
//   - The pill is the entry point to NutritionSheet — colocating it as its
//     own file keeps the recipe meta row readable and makes the "tap → open
//     sheet" affordance reusable elsewhere (e.g., a future shopping flow).
//   - It re-renders only when caloriesPerServing or currentServings change,
//     not on every parent state tick.
//
// Returns null when `caloriesPerServing` is missing so we never render an
// empty "0 kcal" badge that lies about the data.

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export default function NutritionPill({ caloriesPerServing, currentServings, onPress }) {
  const css = useTheme();
  const t = useT();

  if (caloriesPerServing == null) return null;
  const total = Math.round(caloriesPerServing * (currentServings ?? 1));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('recipe.nutrition.openSheet')}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: css.palette.secondary200,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <FontAwesome name="bolt" size={14} color={css.palette.primary800} />
      <Text
        style={[
          styles.text,
          {
            color: css.palette.primary800,
            fontFamily: css.typography.fontUI,
          },
        ]}
      >
        {t('recipe.nutrition.kcal', { count: total })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  text: {
    fontSize: 12,
  },
});
