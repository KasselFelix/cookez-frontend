// ShoppingList — RecipeScreen section listing ingredients the user is
// missing (or only partially owns) from their pantry, each with a "Buy on
// Amazon" CTA.
//
// Why drive the CTA per-row instead of bulk-opening one cart?
//   Amazon doesn't expose a public "add multiple items via URL" pattern
//   that we can authenticate against, and a per-item search keeps each
//   CTA honest — the user lands on a relevant SERP for the exact missing
//   item with the right quantity hint in the query.
//
// Returns null on empty arrays so the parent can render unconditionally.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { formatQuantity } from '../../modules/units';
import AmazonAffiliateButton from './AmazonAffiliateButton';

export default function ShoppingList({ items = [] }) {
  const css = useTheme();
  const t = useT();

  if (!items.length) return null;

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: css.palette.surfaceCard,
          borderRadius: css.radius.lg,
          padding: css.spacing.md,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: css.palette.neutral900,
            fontFamily: css.typography.fontHeading,
            fontSize: css.typography.h3Size,
          },
        ]}
      >
        {t('recipe.shopping.title')}
      </Text>

      {items.map((it, i) => {
        // Composite key: name alone can collide when an ingredient appears
        // twice in different units. Index suffix is a safe tiebreaker.
        // Les items arrivent déjà calculés (RecipeScreen recompute via le
        // memo `shoppingList`), donc on formate juste pour l'affichage.
        const { value, unit } = formatQuantity(it.quantityMissing, it.unit);
        return (
          <View key={`${it.name}-${i}`} style={styles.row}>
            <View style={styles.itemBody}>
              <Text
                style={[
                  styles.name,
                  {
                    color: css.palette.neutral900,
                    fontFamily: css.typography.fontBody,
                  },
                ]}
              >
                {value}{unit} {it.name}
              </Text>
              <Text style={[styles.subtitle, { color: css.palette.neutral700 }]}>
                {t('recipe.shopping.percentOwned', { ratio: it.percentOwned })}
              </Text>
            </View>
            <AmazonAffiliateButton
              ingredientName={it.name}
              quantity={it.quantityMissing}
              unit={it.unit}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16 },
  title: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  itemBody: { flex: 1 },
  name: { fontSize: 14 },
  subtitle: { fontSize: 12, marginTop: 2 },
});
