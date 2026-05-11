// InventoryEmptyState — placeholder for an empty pantry with a CTA.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import BadgeCircle from '../profile/BadgeCircle';

export default function InventoryEmptyState({ onAdd }) {
  const css = useTheme();
  const t = useT();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingVertical: css.spacing.xxl,
          gap: css.spacing.md,
        },
      ]}
      accessibilityLabel={t('profile.inventory.empty.title')}
    >
      <BadgeCircle
        icon={<Package size={32} color={css.palette.accent500} />}
        label=""
        size={72}
      />
      <Text
        style={{
          fontFamily: css.typography.fontHeading,
          fontSize: css.typography.h4Size,
          color: css.palette.neutral900,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {t('profile.inventory.empty.title')}
      </Text>
      <Text
        style={{
          fontFamily: css.typography.fontBody,
          fontSize: 14,
          // No neutral600 token — neutral500 is the muted body tone.
          color: css.palette.neutral500,
          textAlign: 'center',
          paddingHorizontal: css.spacing.lg,
        }}
      >
        {t('profile.inventory.empty.subtitle')}
      </Text>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={t('profile.inventory.empty.cta_a11y')}
        hitSlop={8}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: css.palette.accent500,
            borderRadius: css.radius.pill,
            paddingVertical: css.spacing.sm,
            paddingHorizontal: css.spacing.lg,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: css.typography.fontHeading,
            fontSize: 15,
            color: css.palette.white,
            fontWeight: '600',
          }}
        >
          {t('profile.inventory.empty.cta')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { InventoryEmptyState };
