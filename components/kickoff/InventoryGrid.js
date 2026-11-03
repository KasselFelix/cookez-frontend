// InventoryGrid — Plan 003 Task D.1
//
// Tappable grid of the user's pantry rendered above the existing
// KickoffScreen search/photo UI. Tapping a tile toggles the ingredient
// in the `ingredient` Redux slice — the same slice that feeds
// RecapScreen and ResultScreen.
//
// Why this is its own component:
//   The grid is conditional on (logged in) && (pantry not empty). Keeping
//   it isolated means KickoffScreen stays a thin orchestrator and the grid
//   can be reused later (e.g. quick-pick chips on the home dashboard).
//
// Selector note:
//   The pantry slice stores items at `state.pantry.value.items`, not
//   directly under `.value` — `.value` also holds `{ loading, error }`.
//   We read `.value?.items` and guard with `?? []` so this component is
//   safe even if the slice hasn't been hydrated yet (guest sessions).

import React, { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { addIngredient, removeIngredient } from '../../reducers/ingredient';

export default function InventoryGrid() {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();

  // Read from the canonical pantry path. `value.items` is the array;
  // `value` itself is the `{ items, loading, error }` envelope.
  const pantry = useSelector((s) => s.pantry?.value?.items || []);
  const selected = useSelector((s) => s.ingredient.value);

  // Membership lookup by id-string so toggle stays O(1) per tile and the
  // memoised Set only rebuilds when the selected list actually changes.
  const selectedIds = useMemo(
    () => new Set(selected.map((i) => i.data?._id).filter(Boolean).map(String)),
    [selected]
  );

  // Responsive density: 3 cols on phones < 380 dp, 4 cols on wider devices.
  // Read once at render — Dimensions doesn't change between renders unless
  // the device rotates, which is rare for this flow.
  const cols = Dimensions.get('window').width < 380 ? 3 : 4;

  if (!pantry.length) return null;

  const handleToggle = (item) => {
    // `ingredient` may be a populated subdoc (most common via /inventory)
    // OR a bare ObjectId string in degraded states. Handle both.
    const rawId = item.ingredient?._id || item.ingredient;
    if (!rawId) return; // can't add to a slice that requires _id

    const _id = String(rawId);
    const display_name =
      item.ingredient?.name || item.name || 'unknown';
    // Prefer the new Pexels-cached field; fall back to legacy `image`.
    const photo = item.ingredient?.photoUrl || item.ingredient?.image || null;
    // Pantry items carry both the BDD reference unit (`ingredient.defaultUnit`)
    // and the user's chosen unit at storage time (`item.unit`). Mirror both
    // into the Redux payload so RecapScreen displays the right unit on initial
    // render (e.g. "1L wine" instead of falling back to grams).
    const defaultUnit = item.ingredient?.defaultUnit || 'g';
    const unit = item.unit || defaultUnit;

    const payload = {
      data: {
        _id,
        display_name,
        g_per_serving: item.quantity,
        defaultUnit,
        unit,
        nutrition: item.ingredient?.nutrition,
        // Propagate expiry date so the backend can compute the
        // `expiringIngredients` array (anti-waste bonus) for recipes that
        // use ingredients about to expire within 48h.
        expiryDate: item.expiryDate || null,
      },
      photo,
    };

    if (selectedIds.has(_id)) {
      dispatch(removeIngredient(payload));
    } else {
      dispatch(addIngredient(payload));
    }
  };

  return (
    <View style={styles.grid}>
      {pantry.map((item, idx) => {
        const rawId = item.ingredient?._id || item.ingredient;
        const idStr = rawId ? String(rawId) : null;
        const isSelected = idStr ? selectedIds.has(idStr) : false;
        const display_name =
          item.ingredient?.name || item.name || '—';
        const photoUrl =
          item.ingredient?.photoUrl || item.ingredient?.image || null;
        // Reserve ~2% for gap; width is a string % to play well with flexWrap.
        const cellWidth = `${100 / cols - 2}%`;

        return (
          <Pressable
            key={idStr || `pantry-${idx}`}
            onPress={() => handleToggle(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={t('kickoff.grid.toggleA11y', { name: display_name })}
            hitSlop={4}
            style={({ pressed }) => [
              styles.cell,
              {
                width: cellWidth,
                backgroundColor: isSelected
                  ? css.palette.primary500
                  : css.palette.surfaceCard,
                opacity: pressed ? 0.7 : 1,
                borderColor: isSelected
                  ? css.palette.primary800
                  : 'transparent',
                  // transform: isSelected ? [{ scale: 1.02 }] : [{ scale: 1 }],
                  // ...(isSelected ? css.shadow.md : {}), 
              },
            ]}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.img}
                contentFit="cover"
                transition={120}
              />
            ) : (
              <View
                style={[
                  styles.img,
                  {
                    backgroundColor: css.palette.secondary200,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <FontAwesome
                  name="cutlery"
                  size={24}
                  color={css.palette.neutral500}
                />
              </View>
            )}
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                {
                  color: isSelected ? css.palette.white : css.palette.neutral900,
                  fontFamily: css.typography.fontHeading,
                },
              ]}
            >
              {display_name}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.qty,
                {
                  color: isSelected ? css.palette.white : css.palette.neutral500,
                  fontFamily: css.typography.fontBody,
                },
              ]}
            >
              {item.quantity}
              {item.unit || ''}
            </Text>
            {isSelected && (
              <View
                style={[
                  styles.check,
                  { backgroundColor: css.palette.primary800 },
                ]}
              >
                <FontAwesome name="check" size={10} color="white" />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: '1%',
  },
  cell: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2.5,
  },
  img: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  qty: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
