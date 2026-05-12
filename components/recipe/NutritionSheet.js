// NutritionSheet — BottomSheet showing full nutrition breakdown.
//
// Why bind to the Redux `currentServings` field instead of taking servings
// as a prop?
//   - The sheet *and* RecipeScreen's own stepper must stay in sync. Both
//     read from the same slice so opening the sheet, adjusting servings,
//     and closing it leaves the recipe meta row already updated.
//   - The `null` sentinel means "no override yet — use the recipe's base
//     serving count". We materialize it on first interaction so the
//     stepper doesn't appear to "jump" from baseServings → 2 when the
//     user taps +.
//
// Totals are memoized on (nutritionPerServing, currentServings) so toggling
// the stepper repaints only the right column, not the whole grid.

import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useDispatch, useSelector } from 'react-redux';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import ServingsStepper from '../recipeFilters/ServingsStepper';
import {
  setServings,
  incrementServings,
  decrementServings,
} from '../../reducers/recipeFilters';

const SNAP_POINTS = ['60%'];

const NutritionSheet = React.forwardRef(
  ({ nutritionPerServing, baseServings }, externalRef) => {
    const css = useTheme();
    const t = useT();
    const dispatch = useDispatch();

    const currentServingsRaw = useSelector(
      (s) => s.recipeFilters.value.currentServings
    );
    // Effective value for the math + stepper display. We keep the raw
    // (possibly-null) value around to drive the "materialize on first
    // interaction" logic in the +/- handlers below.
    const effectiveServings = currentServingsRaw ?? baseServings ?? 1;

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

    const totals = useMemo(() => {
      if (!nutritionPerServing) return null;
      const out = {};
      for (const [k, v] of Object.entries(nutritionPerServing)) {
        // Round to one decimal — calories stay tidy, macros keep precision.
        out[k] = Math.round(v * effectiveServings * 10) / 10;
      }
      return out;
    }, [nutritionPerServing, effectiveServings]);

    // On first interaction we explicitly seed `currentServings` from
    // baseServings, so the user doesn't see a jump from (e.g.) 4 → 2 when
    // tapping +. After that, increment/decrement actions clamp [1,12].
    const onIncrement = () => {
      if (currentServingsRaw == null) {
        dispatch(setServings(Math.min((baseServings || 1) + 1, 12)));
      } else {
        dispatch(incrementServings());
      }
    };
    const onDecrement = () => {
      if (currentServingsRaw == null) {
        dispatch(setServings(Math.max((baseServings || 1) - 1, 1)));
      } else {
        dispatch(decrementServings());
      }
    };

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

          <View style={styles.stepperRow}>
            <Text
              style={[
                styles.servingsLabel,
                {
                  color: css.palette.neutral700,
                  fontFamily: css.typography.fontUI,
                },
              ]}
            >
              {t('recipe.servings.label')}
            </Text>
            <ServingsStepper
              value={effectiveServings}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          </View>

          {totals && (
            <View style={styles.list}>
              {Object.entries(totals).map(([key, value]) => (
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
                    {value}
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
  title: { marginBottom: 16 },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servingsLabel: { fontSize: 14 },
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
