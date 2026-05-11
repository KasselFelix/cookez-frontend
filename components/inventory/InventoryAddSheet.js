// InventoryAddSheet — Add/Edit pantry item via @gorhom/bottom-sheet v5.
//
// Two reasons for the kg/L → g/ml normalisation living here:
//   1. The Mongoose schema enum is ["g", "ml", "unit"] — sending "kg" or
//      "L" would 400. Doing the conversion here means every downstream
//      consumer (cards, summary, ingredient match) can assume normalised
//      units, no defensive code needed elsewhere.
//   2. The UI must offer the human-friendly units for ergonomics. The
//      submit-time conversion is the only correct seam — converting on
//      typing would fight the user, converting after API submission
//      would corrupt local state.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import PillChip from '../profile/PillChip';
import { searchIngredients } from '../../modules/pantryApi';

const UNITS = ['g', 'kg', 'ml', 'L', 'unit'];
const LOCATIONS = ['fridge', 'freezer', 'pantry', 'spices', 'other'];
const SEARCH_DEBOUNCE_MS = 250;

const defaultExpiry = (initial) => {
  if (initial?.expiryDate) {
    const d = new Date(initial.expiryDate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // 7 days from today is a sensible default for "I just bought this"
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
};

const formatDate = (d) => {
  if (!d) return '';
  try {
    return d.toLocaleDateString();
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

const normaliseUnit = (rawQty, rawUnit) => {
  const qty = Number(rawQty);
  if (rawUnit === 'kg') return { quantity: qty * 1000, unit: 'g' };
  if (rawUnit === 'L') return { quantity: qty * 1000, unit: 'ml' };
  return { quantity: qty, unit: rawUnit };
};

export default function InventoryAddSheet({ bottomSheetRef, initial, onSubmit }) {
  const css = useTheme();
  const t = useT();
  const token = useSelector((s) => s.user.value.token);

  const snapPoints = useMemo(() => ['75%', '95%'], []);

  const [ingredient, setIngredient] = useState(initial?.ingredient ?? null);
  const [query, setQuery] = useState(initial?.ingredient?.name ?? '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [qty, setQty] = useState(
    initial?.quantity != null ? String(initial.quantity) : '',
  );
  const [unit, setUnit] = useState(
    initial?.unit || initial?.ingredient?.defaultUnit || 'g',
  );
  const [location, setLocation] = useState(
    initial?.storageLocation || initial?.ingredient?.category || 'pantry',
  );
  const [expiryDate, setExpiryDate] = useState(defaultExpiry(initial));
  const [showPicker, setShowPicker] = useState(false);

  // Debounced ingredient search. We bail out if the user has already
  // picked an ingredient — no point re-querying for a match they made.
  const debounceTimerRef = useRef(null);
  useEffect(() => {
    if (ingredient && query === ingredient.name) {
      setResults([]);
      return undefined;
    }
    if (!query || query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      setSearching(true);
      const { ok, data } = await searchIngredients(token, query.trim());
      setSearching(false);
      if (ok && data && Array.isArray(data.ingredients)) {
        setResults(data.ingredients.slice(0, 6));
      } else {
        setResults([]);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, token, ingredient]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handlePickIngredient = (ing) => {
    setIngredient(ing);
    setQuery(ing.name);
    setResults([]);
    if (ing.defaultUnit && UNITS.includes(ing.defaultUnit)) {
      setUnit(ing.defaultUnit);
    }
    if (ing.category && LOCATIONS.includes(ing.category)) {
      setLocation(ing.category);
    }
  };

  const handleClearIngredient = () => {
    setIngredient(null);
    setQuery('');
    setResults([]);
  };

  const handleDatePicked = (event, selected) => {
    // Android dismisses through event.type === 'dismissed'; in either case
    // we hide the picker and only commit if the user actually picked a date.
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (event?.type === 'dismissed') return;
    if (selected) setExpiryDate(selected);
  };

  const canSubmit = !!ingredient && !!qty && Number(qty) > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const { quantity, unit: normalisedUnit } = normaliseUnit(qty, unit);
    const payload = {
      ingredientId: ingredient._id,
      quantity,
      unit: normalisedUnit,
      storageLocation: location,
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
    };
    onSubmit?.(payload);
    bottomSheetRef?.current?.close();
  };

  const renderSearchResult = ({ item }) => (
    <Pressable
      onPress={() => handlePickIngredient(item)}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={({ pressed }) => [
        styles.resultRow,
        {
          paddingVertical: css.spacing.sm,
          paddingHorizontal: css.spacing.md,
          backgroundColor: pressed ? css.palette.neutral100 : css.palette.surfaceCard,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: css.typography.fontBody,
          fontSize: 14,
          color: css.palette.neutral900,
        }}
      >
        {item.name}
      </Text>
    </Pressable>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: css.palette.surfaceCard }}
      handleIndicatorStyle={{ backgroundColor: css.palette.neutral300 }}
    >
      <BottomSheetView style={[styles.sheet, { padding: css.spacing.md }]}>
        <Text
          style={{
            fontFamily: css.typography.fontHeading,
            fontSize: css.typography.h3Size,
            color: css.palette.neutral900,
            fontWeight: '700',
            marginBottom: css.spacing.md,
          }}
        >
          {initial
            ? t('profile.inventory.add_sheet.title_edit')
            : t('profile.inventory.add_sheet.title_add')}
        </Text>

        {/* INGREDIENT AUTOCOMPLETE */}
        <View style={{ marginBottom: css.spacing.md }}>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: css.palette.secondary200,
                borderRadius: css.radius.md,
                paddingHorizontal: css.spacing.md,
              },
            ]}
          >
            <TextInput
              value={query}
              onChangeText={(txt) => {
                setQuery(txt);
                if (ingredient && txt !== ingredient.name) {
                  setIngredient(null);
                }
              }}
              placeholder={t('profile.inventory.add_sheet.ingredient_placeholder')}
              placeholderTextColor={css.palette.neutral500}
              accessibilityLabel={t('profile.inventory.add_sheet.ingredient_placeholder')}
              autoCorrect={false}
              autoCapitalize="none"
              style={{
                flex: 1,
                height: 44,
                fontFamily: css.typography.fontBody,
                fontSize: 14,
                color: css.palette.neutral900,
              }}
            />
            {ingredient ? (
              <Pressable
                onPress={handleClearIngredient}
                accessibilityRole="button"
                accessibilityLabel={t('profile.inventory.add_sheet.ingredient_placeholder')}
                hitSlop={8}
                style={styles.clearBtn}
              >
                <Text style={{ color: css.palette.neutral700, fontSize: 18 }}>×</Text>
              </Pressable>
            ) : null}
            {searching ? <ActivityIndicator size="small" /> : null}
          </View>
          {results.length > 0 && !ingredient ? (
            <View
              style={[
                styles.resultsBox,
                {
                  backgroundColor: css.palette.surfaceCard,
                  borderRadius: css.radius.md,
                  marginTop: css.spacing.xs,
                  borderWidth: 1,
                  borderColor: css.palette.neutral200,
                },
              ]}
            >
              <FlatList
                data={results}
                renderItem={renderSearchResult}
                keyExtractor={(it) => it._id}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          ) : null}
        </View>

        {/* QUANTITY + UNITS */}
        <View style={{ marginBottom: css.spacing.md }}>
          <Text
            style={{
              fontFamily: css.typography.fontUI,
              fontSize: 12,
              color: css.palette.neutral700,
              marginBottom: css.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {t('profile.inventory.add_sheet.qty_placeholder')}
          </Text>
          <View style={{ flexDirection: 'row', gap: css.spacing.sm }}>
            <TextInput
              value={qty}
              onChangeText={setQty}
              placeholder={t('profile.inventory.add_sheet.qty_placeholder')}
              placeholderTextColor={css.palette.neutral500}
              accessibilityLabel={t('profile.inventory.add_sheet.qty_placeholder')}
              keyboardType="numeric"
              style={[
                styles.qtyInput,
                {
                  backgroundColor: css.palette.secondary200,
                  borderRadius: css.radius.md,
                  paddingHorizontal: css.spacing.md,
                  fontFamily: css.typography.fontBody,
                  color: css.palette.neutral900,
                },
              ]}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: css.spacing.xs,
              marginTop: css.spacing.sm,
            }}
          >
            {UNITS.map((u) => (
              <PillChip key={u} active={unit === u} onPress={() => setUnit(u)}>
                {u}
              </PillChip>
            ))}
          </View>
        </View>

        {/* LOCATION */}
        <View style={{ marginBottom: css.spacing.md }}>
          <Text
            style={{
              fontFamily: css.typography.fontUI,
              fontSize: 12,
              color: css.palette.neutral700,
              marginBottom: css.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {t('profile.inventory.filters.all')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: css.spacing.xs }}>
            {LOCATIONS.map((loc) => (
              <PillChip
                key={loc}
                active={location === loc}
                onPress={() => setLocation(loc)}
              >
                {t(`profile.inventory.location.${loc}`)}
              </PillChip>
            ))}
          </View>
        </View>

        {/* EXPIRY */}
        <View style={{ marginBottom: css.spacing.md }}>
          <Text
            style={{
              fontFamily: css.typography.fontUI,
              fontSize: 12,
              color: css.palette.neutral700,
              marginBottom: css.spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {t('profile.inventory.add_sheet.expiry_label')}
          </Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            accessibilityRole="button"
            accessibilityLabel={t('profile.inventory.add_sheet.expiry_label')}
            style={[
              styles.dateBtn,
              {
                backgroundColor: css.palette.secondary200,
                borderRadius: css.radius.md,
                paddingVertical: css.spacing.sm,
                paddingHorizontal: css.spacing.md,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: css.typography.fontBody,
                fontSize: 14,
                color: css.palette.neutral900,
              }}
            >
              {formatDate(expiryDate)}
            </Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={expiryDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDatePicked}
              minimumDate={new Date()}
            />
          ) : null}
        </View>

        {/* SUBMIT */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={
            initial
              ? t('profile.inventory.add_sheet.save')
              : t('profile.inventory.add_sheet.add')
          }
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: canSubmit
                ? css.palette.accent500
                : css.palette.neutral200,
              borderRadius: css.radius.pill,
              opacity: pressed && canSubmit ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: css.typography.fontHeading,
              fontSize: 16,
              color: canSubmit ? css.palette.white : css.palette.neutral500,
              fontWeight: '600',
            }}
          >
            {initial
              ? t('profile.inventory.add_sheet.save')
              : t('profile.inventory.add_sheet.add')}
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  clearBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsBox: {
    maxHeight: 240,
  },
  resultRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  qtyInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
  },
  dateBtn: {
    minHeight: 44,
    justifyContent: 'center',
  },
  submitBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
});

export { InventoryAddSheet };
