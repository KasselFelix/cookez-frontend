// OptionPicker — a field that opens a list of options in a bottom sheet and
// closes on the chosen one. Replaces react-native-picker-select on
// AddRecipeScreen, whose iOS wheel could not be used (plan 017, step 28):
// one implementation for Android and iOS, testable in Jest.
//
// Modal structure of components/recipeFilters/TagsMultiSelect.js
// (statusBarTranslucent, navigationBarTranslucent, animationType="none"),
// opening animated with Reanimated. It closes at once on a choice, like an
// iOS action sheet, so it needs no `rendered` state kept for a closing
// animation.

import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * @param {{
 *   value: string | number | null | undefined,
 *   options: { label: string, value: string | number }[],
 *   onChange: (value: string | number) => void,
 *   placeholder: string,
 *   title: string,
 *   accessibilityLabel: string,
 *   testID?: string,
 * }} props
 */
export default function OptionPicker({ value, options, onChange, placeholder, title, accessibilityLabel, testID }) {
  const css = useTheme();
  const t = useT();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    progress.value = open ? withTiming(1, { duration: 250 }) : 0;
  }, [open, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * SCREEN_HEIGHT }],
  }));

  const openSheet = () => setOpen(true);
  const close = () => setOpen(false);
  const choose = (next) => {
    onChange(next);
    close();
  };

  return (
    <>
      <Pressable
        testID={testID}
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: selected ? selected.label : placeholder }}
        style={({ pressed }) => [
          styles.field,
          // Same look as the other fields of AddRecipeScreen (white, primary
          // border), which keeps the fixed colours of styles/Global; white and
          // primary900 stay the same in every theme, so the text stays legible.
          {
            backgroundColor: css.palette.white,
            borderColor: css.palette.primary800,
            borderWidth: 2,
            borderRadius: css.radius.xs,
            paddingHorizontal: css.spacing.sm,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: selected ? css.palette.primary900 : css.palette.neutral500,
            fontFamily: css.typography.fontUI,
            fontSize: css.typography.captionSize,
          }}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="none"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={close}
      >
        <Animated.View style={[styles.modal, { backgroundColor: css.palette.overlayDark }, backdropStyle]}>
          <Pressable
            onPress={close}
            style={styles.backdropTouchable}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: css.palette.surfaceCard,
                borderTopLeftRadius: css.radius.lg,
                borderTopRightRadius: css.radius.lg,
                paddingHorizontal: css.spacing.md,
                paddingTop: css.spacing.md,
                paddingBottom: css.spacing.lg,
              },
              sheetStyle,
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h3Size,
                color: css.palette.neutral900,
                marginBottom: css.spacing.sm,
              }}
            >
              {title}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.list}>
                {options.map((option) => {
                  const active = option.value === value;
                  return (
                    <Pressable
                      key={String(option.value)}
                      onPress={() => choose(option.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={option.label}
                      style={({ pressed }) => [
                        styles.option,
                        {
                          backgroundColor: active ? css.button.primaryBg : css.palette.secondary200,
                          borderRadius: css.radius.pill,
                          paddingHorizontal: css.spacing.md,
                          marginRight: css.spacing.sm,
                          marginBottom: css.spacing.sm,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active ? css.button.primaryText : css.palette.primary900,
                          fontFamily: css.typography.fontUI,
                          fontSize: css.typography.bodySize,
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '60%',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
