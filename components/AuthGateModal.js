// AuthGateModal — modal centrale affichée quand un guest tente une
// action qui nécessite un compte (vote, favori, commentaire).
//
// Contrôlée par AuthGateProvider via le hook `useAuthGate()`. L'utilisateur
// peut soit :
//   - Tap "Create account" → navigate vers MoreFeaturesScreen (écran
//     explicatif qui invite à se créer un compte ; contient lui-même un
//     CTA vers LoginScreen)
//   - Tap "Not now" → close, reste sur la page courante
//
// Pas de timeout auto — l'utilisateur ferme explicitement.

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';

const REASON_KEYS = new Set(['vote', 'favorite', 'comment', 'comment_vote', 'generic']);

export default function AuthGateModal({ visible, reason = 'generic', onClose }) {
  const css = useTheme();
  const t = useT();
  const navigation = useNavigation();

  const safeReason = REASON_KEYS.has(reason) ? reason : 'generic';

  const goSignUp = () => {
    onClose?.();
    navigation.navigate('MoreFeatures');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: css.palette.overlayDark }]}
        onPress={onClose}
        accessibilityLabel={t('common.close')}
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: css.palette.surfaceCard,
              borderRadius: css.radius.lg,
              ...css.shadow.lg,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={[
              styles.title,
              {
                color: css.palette.neutral900,
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h3Size,
                marginBottom: css.spacing.sm,
              },
            ]}
          >
            {t('auth.gate.title')}
          </Text>

          <Text
            style={[
              styles.reason,
              {
                color: css.palette.neutral700,
                fontFamily: css.typography.fontBody,
                fontSize: css.typography.bodySize,
                lineHeight: css.typography.bodyLine,
                marginBottom: css.spacing.lg,
              },
            ]}
          >
            {t(`auth.gate.reason.${safeReason}`)}
          </Text>

          <View style={[styles.actions, { gap: css.spacing.sm }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('auth.gate.cta.signup')}
              onPress={goSignUp}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: css.palette.primary800,
                  borderRadius: css.radius.pill,
                  paddingVertical: css.spacing.sm,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.primaryText,
                  {
                    color: css.palette.white || '#FFFFFF',
                    fontFamily: css.typography.fontUI,
                  },
                ]}
              >
                {t('auth.gate.cta.signup')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('auth.gate.cta.cancel')}
              onPress={onClose}
              style={({ pressed }) => [
                styles.ghostBtn,
                { paddingVertical: css.spacing.sm, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.ghostText,
                  {
                    color: css.palette.neutral700,
                    fontFamily: css.typography.fontUI,
                  },
                ]}
              >
                {t('auth.gate.cta.cancel')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
  },
  title: {
    fontWeight: '700',
  },
  reason: {
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'column',
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontWeight: '700',
    fontSize: 15,
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
