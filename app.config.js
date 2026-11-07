// Dynamic layer over app.json. Without APP_VARIANT the config is returned
// untouched, so EAS builds and updates see exactly what app.json says.
//
// APP_VARIANT=development builds "Cookez Dev" (com.v2.cookez.dev): a local
// debug build driven by Maestro, installable next to the preview APK that
// targets production. It never loads OTA updates.
module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'development') {
    return config;
  }

  return {
    ...config,
    name: 'Cookez Dev',
    scheme: 'cookez-dev',
    updates: { ...config.updates, enabled: false },
    ios: { ...config.ios, bundleIdentifier: 'com.v2.cookez.dev' },
    android: { ...config.android, package: 'com.v2.cookez.dev' },
  };
};
