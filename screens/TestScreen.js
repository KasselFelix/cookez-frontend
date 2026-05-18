// Dev-only screen — playground pour visualiser/itérer des composants
// graphiques. Accessible via le bouton "TEST" sur HomeScreen. Vide entre
// deux expérimentations — y déposer un preview lorsqu'on veut comparer
// des variantes (palette, animation, layout) sans toucher au reste de
// l'app.
//
// Convention : les composants de preview vivent dans `components/dev/`
// (créer le dossier vide n'importe quand). Les supprimer une fois le
// choix intégré dans le composant de production.

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeProvider';

export default function TestScreen({ navigation }) {
  const css = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: css.palette.surface }]}>
      <View
        style={[
          styles.header,
          { borderBottomColor: css.palette.neutral200 || '#e5e7eb' },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
        >
          <FontAwesome name="angle-left" size={28} color={css.palette.neutral900} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: css.palette.neutral900 }]}>
          Test playground
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.emptyCard, { backgroundColor: css.palette.surfaceCard }]}>
          <Text style={[styles.emptyTitle, { color: css.palette.neutral900 }]}>
            Empty playground
          </Text>
          <Text style={[styles.emptyBody, { color: css.palette.neutral700 }]}>
            Drop a preview component here when you want to iterate visually.
            Convention: previews live in `components/dev/` and get deleted once
            integrated into production.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSpacer: { width: 28 },
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 20,
  },
});
