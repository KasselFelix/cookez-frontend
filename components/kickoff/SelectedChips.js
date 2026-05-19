// SelectedChips — row compacte des ingrédients sélectionnés en mode loggué.
//
// Aggrège deux sources :
//   - `ingredients` (Redux `state.ingredient.value`) : ingrédients nommés
//     issus du tap pantry, search modal, ou analyse Foodvisor déjà résolue.
//   - `pictures` (state local KickoffScreen) : URIs caméra non encore
//     analysées, rendues comme chips génériques "📸 Photo N" — l'analyse
//     Foodvisor se fait au tap Next (handleBtn).
//
// Chaque chip a un × pour retirer son item ; un chip "+ Add" en fin de
// scroll ouvre la modal search (même cible que le FAB en bas).
//
// La dédup des ingrédients est assurée par le slice Redux (`addIngredient`
// filtre déjà par `display_name.toLowerCase()`), donc rien à faire ici.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export default function SelectedChips({
  ingredients = [],
  pictures = [],
  onAdd,
  onRemoveIngredient,
  onRemovePhoto,
}) {
  const css = useTheme();
  const t = useT();

  const totalCount = ingredients.length + pictures.length;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            color: css.palette.primary700,
            fontFamily: css.typography.fontUI,
          },
        ]}
      >
        {t('kickoff.selected.label', { count: totalCount })}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ingredients.map((ing) => {
          const name = ing?.data?.display_name || '';
          return (
            <View
              key={`ing-${ing?.data?._id || name}`}
              style={[
                styles.chip,
                styles.chipFilled,
                {
                  backgroundColor: css.palette.primary800,
                  borderRadius: css.radius.pill,
                },
              ]}
            >
              {/* Icon slot — placeholder for future category icon mapping. */}
              <View style={styles.iconSlot} />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: css.palette.white,
                    fontFamily: css.typography.fontUI,
                  },
                ]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Pressable
                onPress={() => onRemoveIngredient?.({ name, id: ing?.data?._id })}
                accessibilityRole="button"
                accessibilityLabel={t('kickoff.selected.removeA11y', { name })}
                hitSlop={6}
                style={styles.closeBtn}
              >
                <FontAwesome
                  name="times-circle"
                  size={16}
                  color={css.palette.accent500}
                />
              </Pressable>
            </View>
          );
        })}

        {pictures.map((uri, index) => (
          <View
            key={`pic-${uri}`}
            style={[
              styles.chip,
              styles.chipFilled,
              {
                backgroundColor: css.palette.primary800,
                borderRadius: css.radius.pill,
              },
            ]}
          >
            <View style={styles.iconSlot} />
            <Text
              style={[
                styles.chipText,
                {
                  color: css.palette.white,
                  fontFamily: css.typography.fontUI,
                },
              ]}
              numberOfLines={1}
            >
              {t('kickoff.selected.photoLabel', { index: index + 1 })}
            </Text>
            <Pressable
              onPress={() => onRemovePhoto?.(uri)}
              accessibilityRole="button"
              accessibilityLabel={t('kickoff.selected.removePhotoA11y', { index: index + 1 })}
              hitSlop={6}
              style={styles.closeBtn}
            >
              <FontAwesome
                name="times-circle"
                size={16}
                color={css.palette.accent500}
              />
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t('kickoff.selected.add')}
          style={[
            styles.chip,
            styles.chipAdd,
            {
              borderColor: css.palette.primary400,
              borderRadius: css.radius.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              {
                color: css.palette.primary800,
                fontFamily: css.typography.fontUI,
              },
            ]}
          >
            {t('kickoff.selected.add')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  scrollContent: {
    paddingRight: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 32,
  },
  chipFilled: {
    // background appliqué inline via theme
  },
  chipAdd: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
  },
  iconSlot: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 140,
  },
  closeBtn: {
    marginLeft: 6,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
