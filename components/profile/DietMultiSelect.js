// DietMultiSelect — modal with 6 dietary restriction checkboxes.
//
// Reads `user.dietRestrictions` first; falls back to legacy
// `user.settings.diet` (string) so users coming from the old data
// model see their restriction pre-checked.
// Persists via PUT /users/profile.

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import addressIp from '../../modules/addressIp';
import { updateUserInStore } from '../../reducers/user';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

export const DIET_OPTIONS = [
  'gluten_free',
  'dairy_free',
  'no_pork',
  'no_meat',
  'no_nuts',
  'no_red_fruits',
];

/**
 * Resolve the user's current restrictions array, supporting both
 * the new `dietRestrictions[]` array and the legacy single string.
 */
export function readDietRestrictions(user) {
  if (Array.isArray(user?.dietRestrictions) && user.dietRestrictions.length > 0) {
    return [...user.dietRestrictions];
  }
  const legacy = user?.settings?.diet;
  if (typeof legacy === 'string' && legacy.trim().length > 0) {
    return [legacy.trim()];
  }
  return [];
}

export default function DietMultiSelect({ visible, onClose }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  const initial = useMemo(() => readDietRestrictions(user), [user]);
  const [selected, setSelected] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) setSelected(initial);
  }, [visible, initial]);

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const save = async () => {
    if (!user?.token) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${addressIp}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: user.token,
          dietRestrictions: selected,
        }),
      });
      const data = await res.json();
      if (data.result) {
        dispatch(updateUserInStore(data.updatedUser || { dietRestrictions: selected }));
        onClose?.();
      } else {
        Alert.alert(t('common.error'), data.error || t('common.networkError'));
      }
    } catch {
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: css.palette.overlayDark }]}
        onPress={onClose}
        accessibilityLabel={t('common.close')}
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: css.palette.surfaceCard,
              borderRadius: css.radius.lg,
              padding: css.spacing.md,
              ...css.shadow.card,
            },
          ]}
          onPress={() => {}}
        >
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
              {t('settings.diets.title')}
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
            {t('settings.diets.subtitle')}
          </Text>

          <ScrollView style={{ maxHeight: 320 }}>
            {DIET_OPTIONS.map((key) => {
              const isOn = selected.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => toggle(key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isOn }}
                  accessibilityLabel={t(`settings.diets.${key}`)}
                  style={[
                    styles.row,
                    {
                      paddingVertical: css.spacing.cardGap,
                      borderBottomColor: css.palette.neutral200,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isOn ? css.palette.neutral900 : css.palette.neutral300,
                        backgroundColor: isOn ? css.palette.neutral900 : 'transparent',
                        borderRadius: css.radius.xs,
                      },
                    ]}
                  >
                    {isOn ? <Check size={14} color={css.palette.white} /> : null}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: css.typography.fontUI,
                      fontSize: css.typography.bodySize,
                      lineHeight: css.typography.bodyLine,
                      color: css.palette.neutral900,
                      marginLeft: css.spacing.cardGap,
                    }}
                  >
                    {t(`settings.diets.${key}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.btn,
                {
                  borderColor: css.palette.neutral300,
                  borderWidth: 1,
                  borderRadius: css.radius.pill,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text
                style={{
                  fontFamily: css.typography.fontUI,
                  color: css.palette.neutral900,
                  fontWeight: '500',
                }}
              >
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={save}
              disabled={isSaving}
              style={[
                styles.btn,
                {
                  backgroundColor: css.palette.neutral900,
                  borderRadius: css.radius.pill,
                  marginLeft: css.spacing.sm,
                  opacity: isSaving ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('common.save')}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={css.palette.white} />
              ) : (
                <Text
                  style={{
                    fontFamily: css.typography.fontUI,
                    color: css.palette.white,
                    fontWeight: '600',
                  }}
                >
                  {t('common.save')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  btn: {
    minHeight: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { DietMultiSelect };
