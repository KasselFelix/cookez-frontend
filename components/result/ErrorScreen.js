import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

// Full-screen "server reachable but errored" fallback shown by ResultScreen.
// Distinct from OfflineScreen: the device IS online, so telling the user to
// "connect to the Internet" would be a lie. This surfaces a real error + retry.
export default function ErrorScreen({ onRetry }) {
  const css = useTheme();
  const t = useT();

  return (
    <View testID="result-error-screen" style={[styles.root, { backgroundColor: css.palette.background }]}>
      <FontAwesome name="exclamation-triangle" size={64} color={css.palette.error} />
      <Text
        style={[
          styles.title,
          { color: css.palette.neutral900, fontFamily: css.typography.fontHeading, fontSize: css.typography.h2Size },
        ]}
      >
        {t('result.error.title')}
      </Text>
      <Text
        style={[styles.body, { color: css.palette.neutral700, fontFamily: css.typography.fontBody }]}
      >
        {t('result.error.body')}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('result.error.retry')}
        style={({ pressed }) => [styles.btn, { backgroundColor: css.palette.primary500, opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={styles.btnText}>{t('result.error.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { textAlign: 'center', marginTop: 16 },
  body: { textAlign: 'center', paddingHorizontal: 16 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 99, marginTop: 16 },
  btnText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
