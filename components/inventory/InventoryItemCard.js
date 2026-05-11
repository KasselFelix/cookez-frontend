// InventoryItemCard — single pantry item row with inline edit/delete.
//
// `daysUntilExpiry` is precomputed server-side on every populated
// PantryItem so the UI never has to parse the ISO date itself for the
// badge state. moment is imported only as a defensive fallback in case
// a future code path delivers an item without the server field.

import React from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ImageOff, Pencil, Trash2 } from 'lucide-react-native';
import moment from 'moment';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

const resolveDaysUntilExpiry = (item) => {
  if (item == null) return null;
  if (typeof item.daysUntilExpiry === 'number') return item.daysUntilExpiry;
  if (!item.expiryDate) return null;
  // Fallback: compute client-side from ISO string if backend didn't populate.
  const diff = moment(item.expiryDate).startOf('day').diff(moment().startOf('day'), 'days');
  return Number.isFinite(diff) ? diff : null;
};

export default function InventoryItemCard({ item, onEdit, onDelete }) {
  const css = useTheme();
  const t = useT();

  if (!item || !item.ingredient) return null;

  const days = resolveDaysUntilExpiry(item);
  const photoUrl = item.ingredient.photoUrl;

  let expiryColor = null;
  let expiryLabel = null;
  if (days !== null) {
    if (days < 0) {
      expiryColor = css.palette.error;
      expiryLabel = t('profile.inventory.card.expired');
    } else if (days === 0) {
      expiryColor = css.palette.accent500;
      expiryLabel = t('profile.inventory.card.expires_today');
    } else if (days <= 2) {
      expiryColor = css.palette.accent500;
      expiryLabel = t('profile.inventory.card.expires_in', { days });
    } else {
      // No neutral600 token exists; neutral700 is the closest body sub-tone.
      expiryColor = css.palette.neutral700;
      expiryLabel = t('profile.inventory.card.expires_in', { days });
    }
  }

  const locationLabel = item.storageLocation
    ? t(`profile.inventory.location.${item.storageLocation}`)
    : '';
  const subLine = [
    `${item.quantity} ${item.unit}`,
    locationLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={[
        styles.card,
        css.shadow.card,
        {
          backgroundColor: css.palette.surfaceCard,
          borderRadius: css.radius.card,
          padding: css.spacing.md,
          marginHorizontal: css.spacing.md,
          marginBottom: css.spacing.sm,
        },
      ]}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={[styles.photo, { borderRadius: css.radius.md }]}
          contentFit="cover"
          transition={200}
          accessibilityIgnoresInvertColors
        />
      ) : (
        // No Pexels hit yet — render a tokenized placeholder tile rather
        // than requiring a binary asset that Metro would have to bundle.
        <View
          style={[
            styles.photo,
            {
              borderRadius: css.radius.md,
              backgroundColor: css.palette.neutral200,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <ImageOff size={24} color={css.palette.neutral500} />
        </View>
      )}

      <View style={[styles.textBlock, { marginLeft: css.spacing.md }]}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: css.typography.fontHeading,
            fontSize: css.typography.h5Size,
            color: css.palette.neutral900,
            fontWeight: '600',
          }}
        >
          {item.ingredient.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: css.typography.fontBody,
            fontSize: 13,
            color: css.palette.neutral700,
            marginTop: 2,
          }}
        >
          {subLine}
        </Text>
        {expiryLabel ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: css.typography.fontBody,
              fontSize: 12,
              color: expiryColor,
              marginTop: 2,
              fontWeight: '500',
            }}
          >
            {expiryLabel}
          </Text>
        ) : null}
      </View>

      <View style={[styles.actions, { gap: css.spacing.xs }]}>
        <Pressable
          onPress={() => onEdit?.(item)}
          accessibilityRole="button"
          accessibilityLabel={t('profile.inventory.card.edit_a11y', {
            name: item.ingredient.name,
          })}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { padding: css.spacing.xs, opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Pencil size={20} color={css.palette.neutral700} />
        </Pressable>
        <Pressable
          onPress={() => onDelete?.(item._id)}
          accessibilityRole="button"
          accessibilityLabel={t('profile.inventory.card.delete_a11y', {
            name: item.ingredient.name,
          })}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            { padding: css.spacing.xs, opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Trash2 size={20} color={css.palette.error} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photo: {
    width: 64,
    height: 64,
  },
  textBlock: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { InventoryItemCard };
