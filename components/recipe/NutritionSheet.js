// NutritionSheet — BottomSheet showing full nutrition breakdown.
//
// Affiche les valeurs *par portion fixe* (convention universelle des
// labels nutritionnels : MyFitnessPal, Yuka, Open Food Facts, etc.).
// Le total scaled selon le nombre de portions courant est déjà exposé
// par la kcal pill du RecipeScreen ; ce sheet est la fiche de
// référence permettant la comparaison entre recettes.

import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

const SNAP_POINTS = ['60%'];

const NutritionSheet = React.forwardRef(
  ({ nutritionPerServing }, externalRef) => {
    const css = useTheme();
    const t = useT();

    const internalRef = useRef(null);
    const ref = externalRef || internalRef;

    const renderBackdrop = (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView
          style={[styles.body, { backgroundColor: css.palette.surfaceCard }]}
        >
          <Text
            style={[
              styles.title,
              {
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h2Size,
                color: css.palette.neutral900,
              },
            ]}
          >
            {t('recipe.nutrition.title')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontFamily: css.typography.fontUI,
                color: css.palette.neutral500,
              },
            ]}
          >
            {t('recipe.nutrition.perServing')}
          </Text>

          {nutritionPerServing && (
            <View style={styles.list}>
              {Object.entries(nutritionPerServing).map(([key, value]) => (
                <View key={key} style={styles.row}>
                  <Text
                    style={[
                      styles.label,
                      {
                        color: css.palette.neutral700,
                        fontFamily: css.typography.fontBody,
                      },
                    ]}
                  >
                    {t(`recipe.nutrition.${key}`, { defaultValue: key })}
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      {
                        color: css.palette.neutral900,
                        fontFamily: css.typography.fontUI,
                      },
                    ]}
                  >
                    {Math.round(value * 10) / 10}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

NutritionSheet.displayName = 'NutritionSheet';

const styles = StyleSheet.create({
  body: { flex: 1, padding: 24 },
  title: { marginBottom: 4 },
  subtitle: { fontSize: 12, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.6 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
});

export default NutritionSheet;
