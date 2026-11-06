// Development only (mounted under __DEV__ in App.js): listens for
// cookez-dev://dev/theme?name=<themeKey> and applies the theme, so a Maestro flow can capture one
// screen in the five themes without navigating through Settings.
import { useEffect } from 'react';
import { Linking } from 'react-native';

import { useThemeControls } from '../../contexts/ThemeProvider';
import { parseDevThemeUrl } from '../../modules/devThemeLink';

export default function DevThemeLink() {
  const { setTheme } = useThemeControls();

  useEffect(() => {
    const apply = (url) => {
      const themeKey = parseDevThemeUrl(url);
      if (themeKey) setTheme(themeKey);
    };
    Linking.getInitialURL().then(apply).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => apply(url));
    return () => subscription.remove();
  }, [setTheme]);

  return null;
}
