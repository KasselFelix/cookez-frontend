// InventorySearchBar — pill-shaped search input + a primary "add item"
// pill button. The button stays visible at all times (even when the list is
// populated) so adding a second/third item never requires scrolling back to
// the empty-state CTA.
//
// Debouncing intentionally lives in the parent screen (T2.3), not here.
// This component just emits raw onChange so the parent can decide whether
// to debounce, throttle, or fire immediately. Keeping the component
// stateless makes it trivial to control from the screen and easier to test.

import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Plus, Search } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export default function InventorySearchBar({ value, onChange, onAddPress }) {
  const css = useTheme();
  const t = useT();

  return (
    <View
      style={[
        styles.row,
        {
          gap: css.spacing.sm,
          paddingHorizontal: css.spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: css.palette.secondary200,
            borderRadius: css.radius.pill,
            paddingHorizontal: css.spacing.md,
          },
        ]}
      >
        <Search size={18} color={css.palette.neutral700} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={t('profile.inventory.search.placeholder')}
          placeholderTextColor={css.palette.neutral500}
          accessibilityLabel={t('profile.inventory.search.a11y_label')}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={[
            styles.input,
            {
              fontFamily: css.typography.fontBody,
              color: css.palette.neutral900,
              marginLeft: css.spacing.sm,
            },
          ]}
        />
      </View>
      <Pressable
        onPress={onAddPress}
        accessibilityRole="button"
        accessibilityLabel={t('profile.inventory.search.add_a11y')}
        hitSlop={8}
        style={({ pressed }) => [
          styles.iconBtn,
          {
            backgroundColor: css.palette.accent500,
            borderRadius: css.radius.pill,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Plus size={22} color={css.palette.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    padding: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { InventorySearchBar };
