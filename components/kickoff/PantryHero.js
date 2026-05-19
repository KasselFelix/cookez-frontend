// PantryHero — bandeau d'en-tête au-dessus de l'InventoryGrid en mode loggué.
// Titre principal en haut, kicker de comptage juste en-dessous.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export default function PantryHero({ count }) {
  const css = useTheme();
  const t = useT();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            color: css.palette.neutral900,
            fontFamily: css.typography.fontHeading,
            fontSize: css.typography.h3Size,
            lineHeight: css.typography.h3Size * 1.25,
          },
        ]}
      >
        {t('kickoff.pantryHero.title')}
      </Text>
      <Text
        style={[
          styles.kicker,
          {
            color: css.palette.primary700,
            fontFamily: css.typography.fontUI,
          },
        ]}
      >
        {t('kickoff.pantryHero.kicker', { count })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    width: '100%',
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
