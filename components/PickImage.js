import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Root import like the other Lucide files: lucide-react-native 1.14 exports no
// per-icon path (plan 018, step 3).
import { ImagePlus } from 'lucide-react-native';
import { useDispatch } from 'react-redux';

import { useTheme } from '../contexts/ThemeProvider';
import { useT } from '../i18n/useT';
import { setPicture } from '../reducers/picture';

/** Picks the recipe photo from the gallery; needs the recipe name first. */
export default function PickImage({ name }) {
  const dispatch = useDispatch();
  const css = useTheme();
  const t = useT();

  const pickImage = async () => {
    if (!name) {
      alert('fill the fields above before ✍️');
      return;
    }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      dispatch(setPicture(result.assets[0].uri));
    }
  };

  return (
    <Pressable
      onPress={pickImage}
      accessibilityRole="button"
      accessibilityLabel={t('addRecipe.pickImageA11y')}
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
      <ImagePlus size={32} color={css.button.primaryText} />
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
