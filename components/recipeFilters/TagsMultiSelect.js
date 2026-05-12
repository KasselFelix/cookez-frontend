// TagsMultiSelect — horizontal chip row of selected tags + an "add"
// button that opens a sheet with the full vocabulary.
//
// UX rationale:
//   - Selected tags live in the row so the user always sees what's
//     active without opening anything. Tapping a chip toggles it off,
//     matching the modal behaviour for symmetry.
//   - The sheet exposes the full grid; tapping an active chip in the
//     grid removes it. Single mental model: tap = toggle.
//   - `accessibilityState.selected` lets screen readers announce the
//     toggle state — critical for a multi-select control.

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { TAG_VOCABULARY, getTagLabel } from '../../modules/tagVocabulary';

export default function TagsMultiSelect({
  value = [],
  onToggle,
  available = TAG_VOCABULARY,
}) {
  const css = useTheme();
  const t = useT();
  const [open, setOpen] = useState(false);
  const selected = new Set(value);

  return (
    <>
      <View style={styles.row}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {value.length === 0 ? (
            <Text
              style={{
                color: css.palette.neutral500,
                fontFamily: css.typography.fontUI,
                fontSize: css.typography.bodySmSize,
                alignSelf: 'center',
              }}
            >
              {t('recipe.filters.tags.empty')}
            </Text>
          ) : (
            value.map((tag) => (
              <Chip
                key={tag}
                label={getTagLabel(t, tag)}
                active
                onPress={() => onToggle?.(tag)}
                css={css}
              />
            ))
          )}
        </ScrollView>

        <Pressable
          onPress={() => setOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('recipe.filters.tags.openModal')}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: css.palette.primary500,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <FontAwesome name="plus" size={14} color={css.palette.white} />
        </Pressable>
      </View>

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
                {t('recipe.filters.tags.title')}
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

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.tagGrid}>
                {available.map((tag) => (
                  <Chip
                    key={tag}
                    label={getTagLabel(t, tag)}
                    active={selected.has(tag)}
                    onPress={() => onToggle?.(tag)}
                    css={css}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Chip({ label, active, onPress, css }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active
            ? css.palette.primary500
            : css.palette.secondary200,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: active ? css.palette.white : css.palette.primary900,
          fontFamily: css.typography.fontUI,
          fontSize: css.typography.bodySmSize,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginRight: 8,
    marginBottom: 4,
    minHeight: 32,
    justifyContent: 'center',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
