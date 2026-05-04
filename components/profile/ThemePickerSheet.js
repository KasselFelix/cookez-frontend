// ThemePickerSheet — modal grid of theme preview cards.
//
// Each card shows the theme's primary color block + label. Tapping a
// card commits via ThemeProvider.setTheme and closes. The active theme
// gets a visible ring.

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';

import { useTheme, useThemeControls } from '../../contexts/ThemeProvider';
import { THEMES } from '../../styles/themes';
import useT from '../../i18n/useT';

const ORDER = ['light', 'dark', 'pastelMint', 'pastelPeach', 'pastelLavender'];

export default function ThemePickerSheet({ visible, onClose }) {
  const css = useTheme();
  const { themeKey, setTheme } = useThemeControls();
  const t = useT();

  const handlePick = async (key) => {
    await setTheme(key);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: css.palette.overlayDark }]}
        onPress={onClose}
        accessibilityLabel={t('common.close')}
      >
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: css.palette.surfaceCard,
              borderTopLeftRadius: css.radius.lg,
              borderTopRightRadius: css.radius.lg,
              padding: css.spacing.md,
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: css.palette.neutral300 }]} />
          </View>
          <View style={styles.headerRow}>
            <Text
              style={{
                fontFamily: css.typography.fontHeading,
                fontSize: css.typography.h4Size,
                lineHeight: css.typography.h4Line,
                color: css.palette.neutral900,
                fontWeight: '600',
              }}
            >
              {t('settings.theme.title')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={8}
              style={styles.closeBtn}
            >
              <X size={20} color={css.palette.neutral900} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontFamily: css.typography.fontBody,
              fontSize: css.typography.bodySmSize,
              lineHeight: css.typography.bodySmLine,
              color: css.palette.neutral500,
              marginBottom: css.spacing.md,
            }}
          >
            {t('settings.theme.subtitle')}
          </Text>

          <ScrollView contentContainerStyle={styles.cardsRow}>
            {ORDER.map((key) => {
              const themeObj = THEMES[key];
              const previewBg = themeObj.palette.background;
              const previewPrimary = themeObj.button.primaryBg;
              const previewSurface = themeObj.palette.surfaceCard;
              const isActive = themeKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handlePick(key)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`settings.theme.${key}`)}
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.card,
                    {
                      backgroundColor: previewBg,
                      borderRadius: css.radius.md,
                      borderColor: isActive ? css.palette.neutral900 : css.palette.neutral200,
                      borderWidth: isActive ? 2 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.previewBlock,
                      { backgroundColor: previewSurface, borderRadius: css.radius.sm },
                    ]}
                  >
                    <View
                      style={[
                        styles.previewDot,
                        { backgroundColor: previewPrimary, borderRadius: css.radius.pill },
                      ]}
                    />
                  </View>
                  <View style={styles.cardLabelRow}>
                    <Text
                      style={{
                        fontFamily: css.typography.fontUI,
                        fontSize: css.typography.h6Size,
                        lineHeight: css.typography.h6Line,
                        color: themeObj.palette.neutral900,
                        fontWeight: '600',
                      }}
                      numberOfLines={1}
                    >
                      {t(`settings.theme.${key}`)}
                    </Text>
                    {isActive ? (
                      <Check size={14} color={themeObj.palette.neutral900} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '85%',
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  card: {
    width: '48%',
    aspectRatio: 1.2,
    marginBottom: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  previewBlock: {
    flex: 1,
    padding: 8,
    justifyContent: 'flex-end',
  },
  previewDot: {
    width: 24,
    height: 24,
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

export { ThemePickerSheet };
