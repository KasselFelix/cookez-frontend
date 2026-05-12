import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

// Full-screen "no connection + no cache" fallback shown by ResultScreen.
// Why a dedicated screen instead of an inline banner?
//   When there's no cached result we have nothing to show — an inline
//   banner over an empty list is misleading. A blocking screen with a
//   retry CTA gives the user a clear next action and preserves their
//   filters (still in Redux) for when the retry succeeds.
export default function OfflineScreen({ onRetry }) {
  const css = useTheme();
  const t = useT();

  return (
    <View style={[styles.root, { backgroundColor: css.palette.background }]}>
      <FontAwesome name="wifi" size={64} color={css.palette.neutral500} />
      <Text
        style={[
          styles.title,
          {
            color: css.palette.neutral900,
            fontFamily: css.typography.fontHeading,
            fontSize: css.typography.h2Size,
          },
        ]}
      >
        {t('result.offline.title')}
      </Text>
      <Text
        style={[
          styles.body,
          {
            color: css.palette.neutral700,
            fontFamily: css.typography.fontBody,
          },
        ]}
      >
        {t('result.offline.body')}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('result.offline.retry')}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: css.palette.primary500,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={styles.btnText}>{t('result.offline.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: { textAlign: 'center', marginTop: 16 },
  body: { textAlign: 'center', paddingHorizontal: 16 },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
    marginTop: 16,
  },
  btnText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
