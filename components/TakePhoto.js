import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Root import like the other Lucide files: lucide-react-native 1.14 exports no
// per-icon path (plan 018, step 3).
import { Camera } from 'lucide-react-native';
import { useDispatch } from 'react-redux';

import { useTheme } from '../contexts/ThemeProvider';
import { useT } from '../i18n/useT';
import { setPicture } from '../reducers/picture';

/** Takes the recipe photo with the camera; needs the recipe name first. */
export default function TakePhoto({ name }) {
  const dispatch = useDispatch();
  const css = useTheme();
  const t = useT();

  const takePhoto = async () => {
    if (!name) {
      alert('fill the fields above before ✍️');
      return;
    }
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access camera is required!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
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
      onPress={takePhoto}
      accessibilityRole="button"
      accessibilityLabel={t('addRecipe.takePhotoA11y')}
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
      <Camera size={32} color={css.button.primaryText} />
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
