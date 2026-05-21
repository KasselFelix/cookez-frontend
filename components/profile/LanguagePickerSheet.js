// LanguagePickerSheet — bottom sheet with 3 options (System / EN / FR).
//
// Uses the helper from i18n/index.js so persistence and the i18n-js
// singleton stay in sync; then dispatches to the redux slice so the
// React tree re-renders via `useT`.
//
// Modal construction follows the canonical pattern: `statusBarTranslucent`
// + custom Animated fade/slide + `rendered` state for mount control +
// PanResponder drag-to-close on the header zone. Reference: TagsMultiSelect.js.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAG_DISMISS_THRESHOLD = 100;
const DRAG_VELOCITY_THRESHOLD = 0.5;

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

  // `rendered` keeps the Modal mounted while the closing animation plays —
  // without it the Modal would unmount instantly on visible=false and the
  // slide-down would never appear.
  const [rendered, setRendered] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragStartY = useRef(0);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          friction: 9,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible, rendered, backdropOpacity, sheetTranslateY]);

  // Drag-to-close: pattern inspired by FiltersModal/OriginPicker. Attached to
  // the header zone only so option rows keep their tap handling.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation((value) => {
            dragStartY.current = value;
          });
        },
        onPanResponderMove: (_, g) => {
          const next = Math.max(0, dragStartY.current + g.dy);
          sheetTranslateY.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const total = dragStartY.current + g.dy;
          if (total > DRAG_DISMISS_THRESHOLD || g.vy > DRAG_VELOCITY_THRESHOLD) {
            onClose?.();
          } else {
            Animated.spring(sheetTranslateY, {
              toValue: 0,
              friction: 9,
              tension: 60,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            friction: 9,
            tension: 60,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onClose, sheetTranslateY]
  );

  const handlePick = async (key) => {
    await persistLocale(key);
    dispatch(setLocale(key));
    onClose?.();
  };

  return (
    <Modal
      visible={rendered}
      animationType="none"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => onClose?.()}
    >
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: css.palette.overlayDark, opacity: backdropOpacity },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => onClose?.()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: css.palette.surfaceCard,
              borderTopLeftRadius: css.radius.lg,
              borderTopRightRadius: css.radius.lg,
              padding: css.spacing.md,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View {...panResponder.panHandlers}>
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
                onPress={() => onClose?.()}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                hitSlop={8}
                style={styles.closeBtn}
              >
                <X size={20} color={css.palette.neutral900} />
              </TouchableOpacity>
            </View>
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
        </Animated.View>
      </Animated.View>
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
