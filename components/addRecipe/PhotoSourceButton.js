import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';

import { useTheme } from '../../contexts/ThemeProvider';
import { useT } from '../../i18n/useT';
import { useToast } from '../../contexts/ToastProvider';
import { setPicture } from '../../reducers/picture';

/**
 * Round button that gets the recipe photo from one source (camera or gallery)
 * and stores its uri in the picture slice. Needs the recipe name first: without
 * it, `onNameMissing` lets the screen show its message under the buttons,
 * where the user just touched (plan 020). Permission refused and unreadable
 * photo show a toast.
 * @param {{
 *   name: string,
 *   Icon: React.ComponentType<{ size: number, color: string }>,
 *   a11yKey: string,
 *   permissionKey: string,
 *   requestPermission: () => Promise<{ granted: boolean }>,
 *   launch: () => Promise<{ canceled: boolean, assets?: { uri: string }[] }>,
 *   onNameMissing?: () => void,
 * }} props
 */
export default function PhotoSourceButton({
  name,
  Icon,
  a11yKey,
  permissionKey,
  requestPermission,
  launch,
  onNameMissing,
}) {
  const dispatch = useDispatch();
  const css = useTheme();
  const t = useT();
  const { show } = useToast();

  const getPhoto = async () => {
    if (!name) {
      onNameMissing?.();
      return;
    }
    try {
      const permission = await requestPermission();
      if (permission.granted === false) {
        show({ type: 'info', message: t(permissionKey) });
        return;
      }
      const result = await launch();
      if (!result.canceled) {
        dispatch(setPicture(result.assets[0].uri));
      }
    } catch {
      show({ type: 'error', message: t('addRecipe.photoError') });
    }
  };

  return (
    <Pressable
      onPress={getPhoto}
      accessibilityRole="button"
      accessibilityLabel={t(a11yKey)}
      style={({ pressed }) => [
        styles.button,
        {
          // AddRecipeScreen keeps the fixed colours of styles/Global: a chip in
          // the theme's primary-button colours keeps the icon visible on its
          // card in every theme.
          backgroundColor: css.button.primaryBg,
          borderRadius: css.radius.pill,
          padding: css.spacing.md,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Icon size={32} color={css.button.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
