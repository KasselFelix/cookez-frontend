import React from 'react';
import * as ImagePicker from 'expo-image-picker';
// Root import like the other Lucide files: lucide-react-native 1.14 exports no
// per-icon path (plan 018, step 3).
import { ImagePlus } from 'lucide-react-native';

import PhotoSourceButton from './addRecipe/PhotoSourceButton';

const pickFromGallery = () =>
  ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

/** Picks the recipe photo from the gallery; needs the recipe name first
 * (`onNameMissing` is called without it). */
export default function PickImage({ name, onNameMissing }) {
  return (
    <PhotoSourceButton
      name={name}
      onNameMissing={onNameMissing}
      Icon={ImagePlus}
      a11yKey="addRecipe.pickImageA11y"
      permissionKey="addRecipe.galleryPermission"
      requestPermission={ImagePicker.requestMediaLibraryPermissionsAsync}
      launch={pickFromGallery}
    />
  );
}
