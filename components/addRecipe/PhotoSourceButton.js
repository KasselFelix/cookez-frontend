import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';

import { useTheme } from '../../contexts/ThemeProvider';
import { useT } from '../../i18n/useT';
import { setPicture } from '../../reducers/picture';

/**
 * Round button that gets the recipe photo from one source (camera or gallery)
 * and stores its uri in the picture slice. Needs the recipe name first.
 * @param {{
 *   name: string,
 *   Icon: React.ComponentType<{ size: number, color: string }>,
 *   a11yKey: string,
 *   permissionKey: string,
 *   requestPermission: () => Promise<{ granted: boolean }>,
 *   launch: () => Promise<{ canceled: boolean, assets?: { uri: string }[] }>,
 * }} props
 */
export default function PhotoSourceButton({ name, Icon, a11yKey, permissionKey, requestPermission, launch }) {
  const dispatch = useDispatch();
  const css = useTheme();
  const t = useT();

  const getPhoto = async () => {
    if (!name) {
      alert(t('addRecipe.nameFirst'));
      return;
    }
    try {
      const permission = await requestPermission();
      if (permission.granted === false) {
        alert(t(permissionKey));
        return;
      }
      const result = await launch();
      if (!result.canceled) {
        dispatch(setPicture(result.assets[0].uri));
      }
    } catch {
      alert(t('addRecipe.photoError'));
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
