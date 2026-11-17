// ToastProvider — one non-blocking message at a time, at the top of the
// screen, for a success, an info or a recoverable error (plan 020).
//
//   const { show } = useToast();
//   show({ type: 'success', message: t('addRecipe.published') });
//
// - A new toast replaces the current one.
// - It closes on touch, or by itself after a delay that grows with the text
//   (5 s at least for an error), stretched by Android's "Time to take action"
//   setting (AccessibilityInfo.getRecommendedTimeoutMillis).
// - Screen readers: TalkBack reads the live region on Android; iOS has no
//   live region, so the text is announced. Never both (TalkBack would read it
//   twice).
// - A native <Modal> is a separate window above this one: a toast shown while
//   a modal is open stays hidden under it. Errors inside a modal use
//   components/feedback/InlineMessage instead.
//
// Without a provider (a test rendering a screen outside the harness), `show`
// does nothing, like useAuthGate.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Toast from '../components/feedback/Toast';
import { useTheme } from './ThemeProvider';

const noop = () => {};
const ToastContext = createContext({ show: noop, hide: noop });

export function useToast() {
  return useContext(ToastContext);
}

const MIN_DURATION = 4000;
const MIN_ERROR_DURATION = 5000;
const MAX_DURATION = 10000;
const MS_PER_CHAR = 60;
const SLIDE = 24;

/**
 * Display time of a toast, before the accessibility setting stretches it.
 *
 * @param {{ type?: string, title?: string, message: string }} toast
 * @returns {number} milliseconds
 */
export function toastDuration({ type, title = '', message = '' }) {
  const floor = type === 'error' ? MIN_ERROR_DURATION : MIN_DURATION;
  const reading = 1500 + (title.length + message.length) * MS_PER_CHAR;
  return Math.min(MAX_DURATION, Math.max(floor, reading));
}

export default function ToastProvider({ children }) {
  const css = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  // `toast` is what is drawn; it stays set while the closing animation plays,
  // then the animation's end clears it.
  const [toast, setToast] = useState(null);
  const nextId = useRef(0);
  const timer = useRef(null);
  // The toast on screen, read by `hide` (called from a timer or a touch).
  const shown = useRef(null);
  const progress = useSharedValue(0);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // Clears the toast only if no newer one replaced it during the animation.
  const remove = useCallback((id) => {
    setToast((current) => (current && current.id === id ? null : current));
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    const current = shown.current;
    if (!current) return;
    // Closing: a second hide (stray tap, the timer armed late) does nothing.
    shown.current = null;
    progress.value = withTiming(0, { duration: css.animation.fast }, (finished) => {
      if (finished) scheduleOnRN(remove, current.id);
    });
  }, [css.animation.fast, progress, remove]);

  const show = useCallback(({ type = 'info', title, message }) => {
    if (!message) return;
    clearTimer();
    nextId.current += 1;
    setToast({ id: nextId.current, type, title, message });
  }, []);

  // Entrance, timer and announcement of each new toast.
  useEffect(() => {
    shown.current = toast;
    if (!toast) return undefined;
    let cancelled = false;
    progress.value = 0;
    progress.value = withTiming(1, { duration: css.animation.normal });

    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(
        toast.title ? `${toast.title}. ${toast.message}` : toast.message,
      );
    }

    const base = toastDuration(toast);
    Promise.resolve(AccessibilityInfo.getRecommendedTimeoutMillis?.(base) ?? base)
      .catch(() => base)
      .then((delay) => {
        // Replaced, unmounted, or already closed by touch before the delay
        // was known: no timer.
        if (cancelled || shown.current?.id !== toast.id) return;
        timer.current = setTimeout(hide, Math.max(base, delay || 0));
      });

    return () => {
      cancelled = true;
      clearTimer();
    };
    // A new toast is a new id; hiding keeps the same object, so no restart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: reduceMotion ? [] : [{ translateY: (1 - progress.value) * -SLIDE }],
  }));

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        accessibilityLiveRegion={Platform.OS === 'android' ? 'polite' : undefined}
        style={[
          styles.host,
          {
            top: insets.top + css.spacing.sm,
            left: css.spacing.md,
            right: css.spacing.md,
          },
        ]}
      >
        {toast ? (
          <Animated.View style={animatedStyle}>
            <Toast
              testID="toast"
              type={toast.type}
              title={toast.title}
              message={toast.message}
              onClose={hide}
            />
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
  },
});
