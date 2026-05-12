// ExpiryAlert — banner inside RecipeScreen warning the user that some of
// the recipe's ingredients are in their pantry and about to expire.
//
// Why animate on mount?
//   The alert appears contextually (when matching ingredients exist) and
//   we want the user to notice it without being jarring. `fadeInDown`
//   from react-native-animatable is cheap (Animated API under the hood)
//   and matches the easing the rest of the app uses for inline banners.
//
// Returns null on empty arrays so the parent can render it unconditionally.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export default function ExpiryAlert({ ingredients = [] }) {
  const css = useTheme();
  const t = useT();

  if (!ingredients.length) return null;
  const names = ingredients.map((i) => i.name).join(', ');

  return (
    <Animatable.View
      animation="fadeInDown"
      duration={400}
      // Soft amber background + amber left border = standard warning treatment.
      // Falls back to a hardcoded hex only if the palette lacks a warningBg
      // token (defensive — current Global.js provides one).
      style={[
        styles.alert,
        {
          backgroundColor: css.palette.warningBg || '#FFF3CD',
          borderLeftColor: css.palette.accent500,
        },
      ]}
      accessibilityRole="alert"
    >
      <FontAwesome
        name="exclamation-triangle"
        size={18}
        color={css.palette.accent500}
      />
      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            {
              color: css.palette.neutral900,
              fontFamily: css.typography.fontHeading,
            },
          ]}
        >
          {t('recipe.expiry.title')}
        </Text>
        <Text
          style={[
            styles.bodyText,
            {
              color: css.palette.neutral700,
              fontFamily: css.typography.fontBody,
            },
          ]}
        >
          {t('recipe.expiry.body', { items: names })}
        </Text>
      </View>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  bodyText: { fontSize: 13 },
});
