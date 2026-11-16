import React from 'react';
import * as ImagePicker from 'expo-image-picker';
// Root import like the other Lucide files: lucide-react-native 1.14 exports no
// per-icon path (plan 018, step 3).
import { Camera } from 'lucide-react-native';

import PhotoSourceButton from './addRecipe/PhotoSourceButton';

const takeWithCamera = () =>
  ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

/** Takes the recipe photo with the camera; needs the recipe name first. */
export default function TakePhoto({ name }) {
  return (
    <PhotoSourceButton
      name={name}
      Icon={Camera}
      a11yKey="addRecipe.takePhotoA11y"
      permissionKey="addRecipe.cameraPermission"
      requestPermission={ImagePicker.requestCameraPermissionsAsync}
      launch={takeWithCamera}
    />
  );
}
