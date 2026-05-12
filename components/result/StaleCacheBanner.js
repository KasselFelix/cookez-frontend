import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

// Slim banner shown above the result list when ResultScreen falls back
// to a stale (>24h) cached payload because no fresh fetch succeeded.
// The banner signals "this isn't current data" without blocking the
// view; the recipe list below still renders for offline browsing.
export default function StaleCacheBanner() {
  const css = useTheme();
  const t = useT();

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: css.palette.accent200 || '#FFF3CD' },
      ]}
    >
      <FontAwesome name="info-circle" size={14} color={css.palette.neutral900} />
      <Text
        style={[
          styles.text,
          {
            color: css.palette.neutral900,
            fontFamily: css.typography.fontUI,
          },
        ]}
      >
        {t('result.staleCache.message')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  text: { fontSize: 13, flex: 1 },
});
