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
        dispatch(updateUserInStore(data.updatedUser || { location: payload }));
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        await persist({ consent: false });
        Alert.alert(
          t('settings.location.deniedTitle'),
          t('settings.location.deniedMessage'),
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
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
