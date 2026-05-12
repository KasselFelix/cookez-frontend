// ExcludedIngredientsSection — settings block to manage the hard
// exclusion list (ingredients the user never wants suggested).
//
// Design notes:
//   - Storage is by `_id`. We resolve ids → display names lazily via
//     GET /ingredients/:id so a logged-out cold-start doesn't have to
//     hydrate the whole ingredient catalogue.
//   - We chose NOT to reuse the existing <SearchIngredients /> component:
//     that component is a controlled search BAR (not a search+pick
//     widget). It externalizes both the fetch and the result rendering
//     to its parent screen (see KickoffScreen). Adopting it here would
//     require duplicating its parent's plumbing — fetch state, results
//     list, redux ingredient slice, "added basket" UI — none of which
//     fits the settings UX. A small inline search input is the right
//     scope.
//   - Backend endpoint `/ingredients/:name` returns an array of matching
//     ingredients; same pattern KickoffScreen uses.

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import addressIp from '../../modules/addressIp';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

const SEARCH_DEBOUNCE_MS = 300;
const RESULTS_LIMIT = 8;

export default function ExcludedIngredientsSection({ value = [], onChange }) {
  const css = useTheme();
  const t = useT();

  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolvedNames, setResolvedNames] = useState({});

  // Resolve any unknown ids -> names. Re-runs whenever `value` changes
  // (e.g. after an add or after redux hydrates a stored list). We skip
  // ids already in the cache.
  useEffect(() => {
    const missing = value.filter((id) => !resolvedNames[id]);
    if (missing.length === 0) return undefined;

    let cancelled = false;
    (async () => {
      const next = { ...resolvedNames };
      // Sequential is fine — list is tiny (typically < 10 items) and we
      // avoid hammering the API in parallel from a settings screen.
      for (const id of missing) {
        try {
          const res = await fetch(`${addressIp}/ingredients/${id}`);
          const data = await res.json();
          if (cancelled) return;
          if (data?.result && data.ingredient?.name) {
            next[id] = data.ingredient.name;
          }
        } catch {
          // Silent: chip will fall back to id placeholder text.
        }
      }
      if (!cancelled) setResolvedNames(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced ingredient search. We deliberately don't go through the
  // redux ingredient slice (that one is for the meal-planning flow).
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!showSearch) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = searchInput.trim();
    if (term.length === 0) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${addressIp}/ingredients/${encodeURIComponent(term)}`,
        );
        const data = await res.json();
        if (data?.result && Array.isArray(data.ingredients)) {
          // De-dupe by name (same logic as KickoffScreen) and cap
          // results so a tap-target list doesn't blow up the layout.
          const unique = data.ingredients.filter(
            (ing, i, self) =>
              i === self.findIndex((x) => x.name === ing.name),
          );
          setResults(unique.slice(0, RESULTS_LIMIT));
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, showSearch]);

  const handleAdd = (ingredient) => {
    const _id = ingredient?._id;
    if (!_id || value.includes(_id)) {
      // Already excluded or malformed — just collapse the search panel.
      setShowSearch(false);
      setSearchInput('');
      setResults([]);
      return;
    }
    onChange?.([...value, _id]);
    setResolvedNames((prev) => ({ ...prev, [_id]: ingredient.name }));
    setShowSearch(false);
    setSearchInput('');
    setResults([]);
  };

  const handleRemove = (id) => {
    onChange?.(value.filter((v) => v !== id));
  };

  const toggleSearch = () => {
    setShowSearch((s) => {
      const next = !s;
      if (!next) {
        setSearchInput('');
        setResults([]);
      }
      return next;
    });
  };

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: css.palette.surfaceCard,
          padding: css.spacing.md,
          borderRadius: css.radius.lg,
          marginBottom: css.spacing.md,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: css.palette.neutral900,
            fontFamily: css.typography.fontHeading,
            fontSize: css.typography.h4Size,
          },
        ]}
      >
        {t('settings.excludedIngredients.title')}
      </Text>
      <Text
        style={[
          styles.helper,
          {
            color: css.palette.neutral700,
            fontFamily: css.typography.fontBody,
          },
        ]}
      >
        {t('settings.excludedIngredients.helper')}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {value.map((id) => (
          <Pressable
            key={id}
            onPress={() => handleRemove(id)}
            accessibilityRole="button"
            accessibilityLabel={t('settings.excludedIngredients.removeA11y', {
              name: resolvedNames[id] || id,
            })}
            hitSlop={6}
            style={[
              styles.chip,
              { backgroundColor: css.palette.error || '#D32F2F' },
            ]}
          >
            <FontAwesome name="times" size={12} color="white" />
            <Text style={styles.chipText}>{resolvedNames[id] || '…'}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={toggleSearch}
          accessibilityRole="button"
          accessibilityLabel={t('settings.excludedIngredients.addA11y')}
          style={[
            styles.chip,
            { backgroundColor: css.palette.primary500 },
          ]}
        >
          <FontAwesome
            name={showSearch ? 'minus' : 'plus'}
            size={12}
            color="white"
          />
          <Text style={styles.chipText}>
            {t('settings.excludedIngredients.add')}
          </Text>
        </Pressable>
      </ScrollView>

      {showSearch ? (
        <View style={styles.searchWrap}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t('settings.excludedIngredients.searchPlaceholder')}
            placeholderTextColor={css.input.placeholderColor}
            autoFocus
            accessibilityLabel={t('settings.excludedIngredients.searchA11y')}
            style={[
              styles.searchInput,
              {
                borderColor: css.palette.neutral300,
                borderRadius: css.radius.sm,
                paddingVertical: css.spacing.sm,
                paddingHorizontal: css.spacing.cardGap,
                fontFamily: css.typography.fontBody,
                fontSize: css.typography.bodySmSize,
                color: css.palette.neutral900,
                backgroundColor: css.palette.surface,
              },
            ]}
          />

          {searching ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={css.palette.primary500} />
            </View>
          ) : null}

          {!searching && searchInput.trim().length > 0 && results.length === 0 ? (
            <Text
              style={[
                styles.statusText,
                {
                  color: css.palette.neutral500,
                  fontFamily: css.typography.fontBody,
                },
              ]}
            >
              {t('settings.excludedIngredients.noResults')}
            </Text>
          ) : null}

          {results.map((ing) => {
            const disabled = value.includes(ing._id);
            return (
              <Pressable
                key={ing._id}
                onPress={() => !disabled && handleAdd(ing)}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                accessibilityLabel={ing.name}
                style={({ pressed }) => [
                  styles.resultRow,
                  {
                    borderBottomColor: css.palette.neutral200,
                    opacity: pressed || disabled ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: css.palette.neutral900,
                    fontFamily: css.typography.fontBody,
                    fontSize: css.typography.bodySmSize,
                    flex: 1,
                  }}
                >
                  {ing.name}
                </Text>
                {disabled ? (
                  <Text
                    style={{
                      color: css.palette.neutral500,
                      fontFamily: css.typography.fontBody,
                      fontSize: 12,
                    }}
                  >
                    {t('settings.excludedIngredients.alreadyExcluded')}
                  </Text>
                ) : (
                  <FontAwesome
                    name="plus"
                    size={12}
                    color={css.palette.primary500}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  title: { marginBottom: 4 },
  helper: { fontSize: 13, marginBottom: 8 },
  chipRow: {
    gap: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    minHeight: 32,
  },
  chipText: {
    color: 'white',
    fontSize: 13,
  },
  searchWrap: { marginTop: 12 },
  searchInput: {
    borderWidth: 1,
    minHeight: 44,
  },
  statusRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusText: {
    paddingVertical: 12,
    fontSize: 13,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
});
