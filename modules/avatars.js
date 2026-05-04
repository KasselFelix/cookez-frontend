// Avatar presets shared by ProfileScreen and PublicProfileScreen.
// Index 0/1 are the legacy default_M/default_F slots — pickers skip them.
const availableImages = [
  { nameFile: 'default_M', path: require('../assets/profile/avatar_M.jpg') },
  { nameFile: 'default_F', path: require('../assets/profile/avatar_F.jpg') },
  { nameFile: 'default_M1', path: require('../assets/profile/avatar_M1.jpg') },
  { nameFile: 'default_M2', path: require('../assets/profile/avatar_M2.jpg') },
  { nameFile: 'avatar_M3', path: require('../assets/profile/avatar_M3.jpg') },
  { nameFile: 'avatar_M4', path: require('../assets/profile/avatar_M4.jpg') },
  { nameFile: 'avatar_F1', path: require('../assets/profile/avatar_F1.jpg') },
  { nameFile: 'avatar_F2', path: require('../assets/profile/avatar_F2.jpg') },
  { nameFile: 'avatar_F3', path: require('../assets/profile/avatar_F3.jpg') },
  { nameFile: 'avatar_F4', path: require('../assets/profile/avatar_F4.jpg') },
];

// Resolves a stored image value (preset name or remote URL) to an <Image> source.
function getAvatarSource(image) {
  if (typeof image === 'string' && image.startsWith('http')) {
    return { uri: image };
  }
  const found = availableImages.find((e) => e.nameFile === image);
  return found?.path || availableImages[0].path;
}

export { availableImages, getAvatarSource };
export default availableImages;
