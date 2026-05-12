// OriginPicker — searchable bottom-sheet picker backed by GET /recipes/origins.
//
// Why a Modal instead of @gorhom/bottom-sheet:
//   - The recap screen is wrapped in a SafeAreaView from
//     react-native-safe-area-context, but does NOT live inside a
//     GestureHandlerRootView with a BottomSheetModalProvider. Using
//     the native Modal here keeps the surface self-contained without
//     requiring a provider lift.
//
// Caching: origins fetch fires lazily on first open, results persist
// in component-local state for the session. The list is short (< 30
// items in production) so the extra memory cost is negligible compared
// to the network round-trip.

import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { fetchOrigins } from '../../modules/recipesApi';

export default function OriginPicker({ value, onChange }) {
  const css = useTheme();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [origins, setOrigins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Lazy fetch — only hits the API the first time the sheet opens.
  useEffect(() => {
    if (!open || origins.length > 0 || loading) return;
    const controller = new AbortController();
    setLoading(true);
    fetchOrigins({ signal: controller.signal })
      .then((data) => {
        if (data?.result && Array.isArray(data.origins)) {
          setOrigins(data.origins);
        }
      })
      .catch(() => {
        // Silent fail — the empty list is acceptable UX (user can still
        // close & retry). Keeping the screen alive matters more than a
        // toast here.
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, origins.length, loading]);

  const filtered = useMemo(() => {
    if (!query) return origins;
    const q = query.toLowerCase();
    return origins.filter((o) => o.toLowerCase().includes(q));
  }, [origins, query]);

  // Prepend a synthetic "clear" row so users can wipe the selection
  // without leaving the sheet. Key collision impossible — '__clear'
  // can't appear in a country list.
  const rows = useMemo(
    () => [
      { key: '__clear', display: t('recipe.filters.origin.clear') },
      ...filtered.map((o) => ({ key: o, display: o })),
    ],
    [filtered, t],
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('recipe.filters.origin.label')}
        accessibilityValue={{
          text: value || t('recipe.filters.origin.placeholder'),
        }}
        style={[
          styles.trigger,
          {
            borderColor: css.input.borderColor,
            backgroundColor: css.input.bg,
            borderRadius: css.radius.md,
            paddingVertical: css.spacing.sm + 4,
            paddingHorizontal: css.spacing.md,
          },
        ]}
      >
        <Text
          style={{
            color: value ? css.palette.neutral900 : css.palette.neutral500,
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.bodySize,
          }}
        >
          {value || t('recipe.filters.origin.placeholder')}
        </Text>
        <FontAwesome
          name="chevron-down"
          size={14}
          color={css.palette.primary800}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.modal, { backgroundColor: css.palette.overlayDark }]}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: css.palette.surfaceCard,
                paddingHorizontal: css.spacing.md,
                paddingTop: css.spacing.md,
                paddingBottom: css.spacing.lg,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text
                style={{
                  fontFamily: css.typography.fontHeading,
                  fontSize: css.typography.h3Size,
                  color: css.palette.neutral900,
                }}
              >
                {t('recipe.filters.origin.title')}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <FontAwesome
                  name="times"
                  size={20}
                  color={css.palette.neutral700}
                />
              </Pressable>
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('recipe.filters.origin.searchPlaceholder')}
              placeholderTextColor={css.palette.neutral500}
              accessibilityLabel={t('recipe.filters.origin.searchPlaceholder')}
              style={[
                styles.search,
                {
                  borderColor: css.input.borderColor,
                  color: css.palette.neutral900,
                  fontFamily: css.typography.fontBody,
                  fontSize: css.typography.bodySize,
                  borderRadius: css.radius.md,
                  marginBottom: css.spacing.md,
                },
              ]}
              autoFocus
            />

            <FlatList
              data={rows}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isClear = item.key === '__clear';
                const isSelected = !isClear && value === item.key;
                return (
                  <Pressable
                    onPress={() => {
                      onChange?.(isClear ? null : item.key);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: pressed
                          ? css.palette.secondary200
                          : isSelected
                          ? css.palette.secondary300
                          : 'transparent',
                        borderRadius: css.radius.sm,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: css.palette.neutral900,
                        fontFamily: css.typography.fontUI,
                        fontSize: css.typography.bodySize,
                      }}
                    >
                      {item.display}
                    </Text>
                    {isSelected && (
                      <FontAwesome
                        name="check"
                        size={14}
                        color={css.palette.primary800}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  search: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
