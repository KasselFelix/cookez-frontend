import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, Leaf } from 'lucide-react-native';

import css from '../../styles/Global';
import { useResponsive } from '../../styles/responsive';
import { getAvatarSource } from '../../modules/avatars';
import PillChip from './PillChip';
import { useTheme } from '../../contexts/ThemeProvider';

/**
 * ProfileIdentityBlock
 * Avatar + display name + subtitle + optional chips row.
 *
 * Used in two modes:
 *  - editable=true  → ProfileScreen (own profile, avatar shows camera badge,
 *                     pressing fires onAvatarPress).
 *  - editable=false → PublicProfileScreen (read-only, avatar is a static Image).
 *
 * Layout:
 *  - Phone: row with avatar on the left and identity text on the right.
 *  - Centered variant (set `centered`) stacks vertically (used by PublicProfile).
 *
 * Props:
 *  - user             : { username, firstname, lastname, image, settings,
 *                         cuisineSpecialty, ... }
 *  - editable         : boolean (default false)
 *  - centered         : boolean — stack vertically and center-align (default false)
 *  - onAvatarPress    : () => void — required when editable=true
 *  - subtitleOverride : string — bypass default `${cuisine} · ${household}` rule
 *  - showChips        : boolean (default true) — toggles diet/allergy chips row
 */
export default function ProfileIdentityBlock({
  user,
  editable = false,
  centered = false,
  onAvatarPress,
  subtitleOverride,
  showChips = true,
}) {
  const css = useTheme();
  const { isTablet } = useResponsive();
  const avatarSize = isTablet ? 96 : 72;
  const avatarSource = useMemo(() => getAvatarSource(user?.image), [user?.image]);

  const displayName =
    `${user?.firstname || ''} ${user?.lastname || ''}`.trim() ||
    user?.username ||
    'Chef';

  const householdValue = user?.settings?.householdComposition || 0;
  const diet = user?.settings?.diet;
  const allergyCount = user?.settings?.allergy?.length || 0;
  const cuisineSpecialty = user?.cuisineSpecialty;

  const householdLabel = `${householdValue} ${householdValue === 1 ? 'person' : 'people'}`;
  const allergyLabel =
    allergyCount === 0
      ? 'No allergies'
      : `${allergyCount} ${allergyCount === 1 ? 'allergy' : 'allergies'}`;

  const subtitle =
    subtitleOverride ?? `${cuisineSpecialty || 'Home cook'} · ${householdLabel}`;

  const avatarStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
  };
  // Camera badge sized proportionally to avatar so it stays visually balanced
  // on both phone (72) and tablet (96).
  const badgeSize = Math.round(avatarSize * 0.3);
  const badgeStyle = {
    width: badgeSize,
    height: badgeSize,
    borderRadius: badgeSize / 2,
  };

  const Avatar = (
    <View style={[styles.avatarWrap, avatarStyle]}>
      <Image
        source={avatarSource}
        style={[styles.avatar, avatarStyle]}
        accessibilityIgnoresInvertColors
      />
      {editable ? (
        <View style={[styles.avatarBadge, badgeStyle]} pointerEvents="none">
          <Camera size={Math.round(badgeSize * 0.55)} color={css.palette.white} />
        </View>
      ) : null}
    </View>
  );

  const AvatarTouchable =
    editable && onAvatarPress ? (
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel="Change avatar"
        hitSlop={8}
      >
        {Avatar}
      </Pressable>
    ) : (
      Avatar
    );

  const NameAndSubtitle = (
    <>
      <Text
        style={[styles.name, centered && styles.nameCentered,{color: css.palette.neutral900}]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {displayName}
      </Text>
      <Text
        style={[styles.subtitle, centered && styles.subtitleCentered,{color: css.palette.neutral500}]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </>
  );

  const Chips =
    showChips ? (
      <View
        style={[styles.chipsRow, centered && styles.chipsRowCentered]}
        accessibilityRole="list"
      >
        <PillChip icon={<Leaf size={12} color={css.palette.neutral900} />}>
          {diet || 'No diet'}
        </PillChip>
        <View style={styles.chipSpacer} />
        <PillChip>{allergyLabel}</PillChip>
      </View>
    ) : null;

  if (centered) {
    return (
      <View style={styles.containerCentered}>
        {AvatarTouchable}
        <View style={styles.centeredText}>
          {NameAndSubtitle}
          {Chips}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor:   css.palette.surfaceCard }]}>
      {AvatarTouchable}
      <View style={styles.right}>
        {NameAndSubtitle}
        {Chips}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: css.spacing.md,
    gap: css.spacing.cardGap,
  },
  containerCentered: {
    alignItems: 'center',
    backgroundColor: css.palette.surfaceCard,
    padding: css.spacing.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: css.palette.neutral200,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: css.palette.neutral900,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: css.palette.white,
  },
  right: {
    flex: 1,
    justifyContent: 'center',
  },
  centeredText: {
    alignItems: 'center',
    marginTop: css.spacing.cardGap,
    width: '100%',
  },
  name: {
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h4Size,
    lineHeight: css.typography.h4Line,
    fontWeight: '700',
  },
  nameCentered: {
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: css.typography.fontUI,
    fontSize: css.typography.h6Size,
    lineHeight: css.typography.h6Line,
    marginTop: css.spacing.xs,
  },
  subtitleCentered: {
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: css.spacing.sm,
    flexWrap: 'wrap',
  },
  chipsRowCentered: {
    justifyContent: 'center',
  },
  chipSpacer: {
    width: css.spacing.sm,
    height: css.spacing.sm,
  },
});

export { ProfileIdentityBlock };
