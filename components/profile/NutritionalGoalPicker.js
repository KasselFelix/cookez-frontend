// NutritionalGoalPicker — radio modal with the 4 nutritional goals.
// Persists via PUT /users/profile.

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';

import { putUserProfile } from '../../modules/recipesApi';
import { updateUserInStore } from '../../reducers/user';
import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import InlineMessage from '../feedback/InlineMessage';

export const NUTRITIONAL_GOALS = ['weight_loss', 'muscle_gain', 'balanced', 'seasonal_local'];

export default function NutritionalGoalPicker({ visible, onClose }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  const [selected, setSelected] = useState(user?.nutritionalGoal || null);
  const [isSaving, setIsSaving] = useState(false);
  // Shown inside the modal: a toast would stay hidden under it (plan 020).
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setSelected(user?.nutritionalGoal || null);
      setError('');
    }
  }, [visible, user?.nutritionalGoal]);

  const save = async (goal) => {
    if (!user?.token) return;
    setIsSaving(true);
    setError('');
    try {
      const data = await putUserProfile({ token: user.token, updates: { nutritionalGoal: goal } });
      if (data.result) {
        // Backend now returns `{ result, updated }` with only the changed
        // fields (post-normalisation), so we can dispatch it as-is.
        if (data.updated) dispatch(updateUserInStore(data.updated));
        onClose?.();
      } else {
        setError(data.error || t('common.networkError'));
      }
    } catch {
      setError(t('common.networkError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
              {t('settings.nutritionalGoals.title')}
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

          {NUTRITIONAL_GOALS.map((key) => {
            const isOn = selected === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  // Tap on the active row clears the goal (toggle off).
                  const next = isOn ? null : key;
                  setSelected(next);
                  save(next);
                }}
                disabled={isSaving}
                accessibilityRole="radio"
                accessibilityState={{ selected: isOn }}
                accessibilityLabel={t(`settings.nutritionalGoals.${key}`)}
                style={[
                  styles.row,
                  {
                    paddingVertical: css.spacing.cardGap,
                    borderBottomColor: css.palette.neutral200,
                    opacity: isSaving && !isOn ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isOn ? css.palette.neutral900 : css.palette.neutral300,
                    },
                  ]}
                >
                  {isOn ? (
                    <View style={[styles.radioDot, { backgroundColor: css.palette.neutral900 }]} />
                  ) : null}
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: css.typography.fontUI,
                    fontSize: css.typography.bodySize,
                    lineHeight: css.typography.bodyLine,
                    color: css.palette.neutral900,
                    marginLeft: css.spacing.cardGap,
                    fontWeight: isOn ? '600' : '400',
                  }}
                >
                  {t(`settings.nutritionalGoals.${key}`)}
                </Text>
                {isOn && isSaving ? (
                  <ActivityIndicator size="small" color={css.palette.neutral900} />
                ) : isOn ? (
                  <Check size={18} color={css.palette.neutral900} />
                ) : null}
              </TouchableOpacity>
            );
          })}
          <InlineMessage
            testID="goal-error"
            message={error}
            style={{ marginTop: css.spacing.sm }}
          />
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
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
