// LanguagePickerSheet — bottom sheet with 3 options (System / EN / FR).
//
// Uses the helper from i18n/index.js so persistence and the i18n-js
// singleton stay in sync; then dispatches to the redux slice so the
// React tree re-renders via `useT`.

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import useT from '../../i18n/useT';
import { setLocale as persistLocale } from '../../i18n';
import { setLocale } from '../../reducers/locale';
import { useTheme } from '../../contexts/ThemeProvider';

const OPTIONS = [
  { key: 'system',  labelKey: 'settings.language.system' },
  { key: 'en',      labelKey: 'settings.language.english' },
  { key: 'fr',      labelKey: 'settings.language.french' },
];

export default function LanguagePickerSheet({ visible, onClose }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const current = useSelector((state) => state?.locale?.value?.lang ?? 'system');

  const handlePick = async (key) => {
    await persistLocale(key);
    dispatch(setLocale(key));
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
              {t('settings.language.title')}
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

          {OPTIONS.map(({ key, labelKey }) => {
            const isActive = current === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => handlePick(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={t(labelKey)}
                style={[
                  styles.row,
                  {
                    paddingVertical: css.spacing.cardGap,
                    paddingHorizontal: css.spacing.md,
                    borderBottomColor: css.palette.neutral200,
                  },
                ]}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily: css.typography.fontUI,
                    fontSize: css.typography.bodySize,
                    lineHeight: css.typography.bodyLine,
                    color: css.palette.neutral900,
                    fontWeight: isActive ? '600' : '400',
                  }}
                >
                  {t(labelKey)}
                </Text>
                {isActive ? <Check size={18} color={css.palette.neutral900} /> : null}
              </TouchableOpacity>
            );
          })}
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
    marginBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: 1,
  },
});

export { LanguagePickerSheet };
