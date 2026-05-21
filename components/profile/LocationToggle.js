// LocationToggle — Switch that requests permission via expo-location,
// fetches the current coordinates if granted, and persists either the
// coords + consent=true, or consent=false (with no coords).
//
// Why a Switch and not a sheet? Location is binary — either we have
// permission or not. The richer "city / region" override lives in the
// Personal info modal so this surface stays uncluttered.

import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import addressIp from '../../modules/addressIp';
import { updateUserInStore } from '../../reducers/user';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

// We import lazily inside the handler so the component still mounts
// even if expo-location isn't installed yet (the dependency is part
// of the Vague 3 install list and the toggle no-ops gracefully).
let Location = null;
try {
  // eslint-disable-next-line global-require
  Location = require('expo-location');
} catch {
  Location = null;
}

export default function LocationToggle() {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);
  const consent = !!user?.location?.consent;

  const [isWorking, setIsWorking] = useState(false);

  const persist = async (payload) => {
    setIsWorking(true);
    try {
      const res = await fetch(`${addressIp}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: user.token, location: payload }),
      });
      const data = await res.json();
      if (data.result) {
        // Targeted partial dispatch: PUT /profile returns the user without
        // populating recipes/favorites, so spreading the whole `updatedUser`
        // overwrites the populated arrays we already have in memory with
        // bare ObjectIds (cards then render "Untitled"). Touch only `location`.
        dispatch(updateUserInStore({ location: data.updatedUser?.location ?? payload }));
      } else {
        Alert.alert(t('common.error'), data.error || t('common.networkError'));
      }
    } catch {
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggle = async (next) => {
    if (!user?.token) return;
    if (!next) {
      // Disabling: store consent=false, drop coords. Region (manual) is
      // preserved server-side because we send a partial location object
      // and the helper merges fields rather than overwriting.
      await persist({ consent: false });
      return;
    }

    if (!Location) {
      Alert.alert(
        t('settings.location.errorTitle'),
        'expo-location is not installed.',
      );
      return;
    }

    try {
      setIsWorking(true);

      // 1) OS-level pre-check — on Android, even with the runtime
      // permission granted, getCurrentPositionAsync silently throws if
      // GPS / Location services are turned off at the device level.
      // We surface a dedicated message instead of the generic error.
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        Alert.alert(
          t('settings.location.servicesDisabledTitle'),
          t('settings.location.servicesDisabledMessage'),
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        await persist({ consent: false });
        Alert.alert(
          t('settings.location.deniedTitle'),
          t('settings.location.deniedMessage'),
        );
        return;
      }

      // 2) Balanced accuracy + 10s timeout — Android can hang indefinitely
      // on slow / cold-start GPS fixes. Race against a manual timeout so
      // we can fall back to the last-known position rather than freezing
      // the UI on the spinner.
      let pos;
      try {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 10000),
          ),
        ]);
      } catch (err) {
        // 3) Fallback on timeout — try the OS cache. If we get something
        // recent, persist those coords; otherwise show a timeout-specific
        // message rather than the generic one.
        if (err?.message === 'TIMEOUT') {
          const cached = await Location.getLastKnownPositionAsync();
          if (cached?.coords) {
            await persist({
              coords: { lat: cached.coords.latitude, lng: cached.coords.longitude },
              consent: true,
            });
            return;
          }
          Alert.alert(
            t('settings.location.errorTitle'),
            t('settings.location.timeoutMessage'),
          );
          return;
        }
        throw err;
      }

      await persist({
        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        consent: true,
      });
    } catch {
      Alert.alert(
        t('settings.location.errorTitle'),
        t('settings.location.errorMessage'),
      );
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {isWorking ? (
        <ActivityIndicator size="small" color={css.palette.neutral900} />
      ) : null}
      <Switch
        value={consent}
        onValueChange={handleToggle}
        disabled={isWorking}
        trackColor={{
          false: css.palette.neutral300,
          true: css.palette.primary500,
        }}
        thumbColor={css.palette.white}
        accessibilityLabel={t('settings.appPrefs.location')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export { LocationToggle };
