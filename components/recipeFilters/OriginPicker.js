// OriginPicker — searchable bottom-sheet, MULTI-select, flag emoji per row.
//
// Source of truth for the list: `modules/countries.js` (static ISO list with
// EN + FR names). Always shows the full world so users can discover cuisines
// we don't yet have recipes for. Empty-result handling happens downstream
// (ResultScreen).
//
// `value` is an array of canonical English country names — same shape that
// gets stored in `Recipe.origin` and sent in the /recipes/result payload.
//
// Sheet behavior:
//   - On open, we measure the trigger's screen position so the sheet anchors
//     just below it. The trigger stays visible, the user keeps context.
//   - Modal renders with a transparent backdrop (no dimming). Tap-outside
//     does NOT close — the only close gesture is the grab-bar drag down.
//   - The drag zone is a dedicated padded wrapper around the visual bar.
//     PanResponder lives only there so the FlatList below scrolls normally
//     and the "Clear" button doesn't intercept the gesture.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
// RN's <Modal> renders into a separate native window, which the App-root
// GestureHandlerRootView doesn't cover. Without a nested root inside the
// modal, RNGH's TouchableOpacity silently no-ops on Android (iOS is more
// forgiving). Wrapping the modal content in a local GestureHandlerRootView
// gives RNGH a touch surface to listen on, and pairing the RNGH FlatList
// with the RNGH TouchableOpacity keeps the gesture pipeline uniform.
import {
  FlatList,
  GestureHandlerRootView,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import {
  COUNTRIES,
  flagEmoji,
  flagForOriginName,
  localizedCountryName,
} from '../../modules/countries';

// Use SCREEN height (not window) so dimensions account for the Android system
// nav bar / gesture area. Combined with statusBarTranslucent on the Modal
// below, this guarantees the sheet covers the full physical screen.
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const CLOSE_THRESHOLD = 100;  // downward drag past this → close
const EXPAND_THRESHOLD = 50;  // upward drag past this → snap to expanded
const COLLAPSE_THRESHOLD = 50; // downward drag from expanded → snap back to collapsed
// Hard ceiling so the sheet never reaches the very top — leaves room for the
// screen's status bar / back-button row.
const EXPANDED_TOP = 80;
const FALLBACK_TOP = SCREEN_HEIGHT * 0.3;

export default function OriginPicker({ value, onChange }) {
  const css = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const localeMode = useSelector(
    (state) => state?.locale?.value?.lang ?? 'system',
  );
  const isFrench = localeMode === 'fr';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Y coordinate where the sheet's TOP edge anchors — set on each open
  // via `measureInWindow` on the trigger.
  const [topOffset, setTopOffset] = useState(FALLBACK_TOP);

  // Sheet height derived from the anchor — distance from anchor to bottom
  // of screen. Used to seed the slide-in animation from off-screen below.
  const sheetHeight = Math.max(SCREEN_HEIGHT - topOffset, 200);

  // translateY is the OFFSET applied to the sheet's resting top position.
  //   0  → sheet at `topOffset` (collapsed, just below the trigger)
  //   <0 → sheet has been dragged up (toward EXPANDED_TOP)
  //   >0 → sheet has been dragged down (toward closed)
  // The drag clamp prevents the user from pulling the sheet above
  // EXPANDED_TOP regardless of how hard they drag up.
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  // Backdrop dim is driven independently from translateY so the fade-in
  // speed doesn't depend on the spring's velocity profile. Timing-based,
  // matching the Tags picker's 425ms fade.
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Captures the translateY value at the start of each pan gesture so we can
  // compute absolute positions correctly when the user drags from a state
  // other than 0 (e.g. dragging down from the expanded position).
  const dragStartY = useRef(0);
  const triggerRef = useRef(null);
  // Direct ref on the TextInput so we can imperatively blur() it when the
  // user picks a country. `Keyboard.dismiss()` alone is unreliable on some
  // devices — if the focused input still owns the focus, the system can
  // re-raise the keyboard or eat the next tap; blur() is the surer path.
  const searchInputRef = useRef(null);

  const selected = Array.isArray(value) ? value : [];
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const animateIn = (heightToCover) => {
    translateY.setValue(heightToCover);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 60,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 425,//425
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openSheet = () => {
    // Fixed-height bottom sheet: sheet top sits at ~1/3 of the screen so it
    // covers the bottom 2/3. The trigger may be covered — acceptable
    // tradeoff for usable list height on small devices. Drag-up still
    // expands to EXPANDED_TOP for full-screen browsing.
    setOpen(true);
    const fixedTop = Math.round(SCREEN_HEIGHT / 3);
    setTopOffset(fixedTop);
    animateIn(Math.max(SCREEN_HEIGHT - fixedTop, 200));
  };

  const closeSheet = () => {
    // Dismiss the keyboard alongside the sheet so it doesn't linger after
    // the modal unmounts (would otherwise still be visible while typing
    // in any subsequent screen until the user taps elsewhere).
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight + 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 425,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setQuery('');
    });
  };

  // PanResponder attached only to the dedicated drag zone around the bar.
  // `onStartShouldSetPanResponder: () => true` because the zone contains
  // nothing tappable, so capturing every touch is safe.
  //
  // Snap logic on release:
  //   final < -EXPAND_THRESHOLD          → snap to expanded (top = EXPANDED_TOP)
  //   final >  CLOSE_THRESHOLD (from collapsed) → close
  //   final >  COLLAPSE_THRESHOLD (from expanded) → snap back to collapsed
  //   otherwise → snap to the position the gesture started from
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        // Drag = the user wants to either close or expand. Either way, the
        // keyboard isn't useful any more — dismiss it so the next gesture
        // frame isn't fighting for vertical space.
        Keyboard.dismiss();
        // Stop the ongoing slide-in spring (or any other in-flight tween)
        // BEFORE capturing dragStartY. Without this, the spring keeps
        // writing to `translateY` in parallel with our pan-driven setValue
        // calls — the user's finger and the spring fight, and the sheet
        // teleports. The callback receives the value at the moment the
        // animation was halted, which is exactly where the finger is now.
        translateY.stopAnimation((value) => {
          dragStartY.current = value;
        });
      },
      onPanResponderMove: (_, g) => {
        const minAllowed = -(topOffset - EXPANDED_TOP); // negative cap
        let next = dragStartY.current + g.dy;
        if (next < minAllowed) next = minAllowed;
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const final = dragStartY.current + g.dy;
        const expandedY = -(topOffset - EXPANDED_TOP);
        const startedExpanded = dragStartY.current < -10;

        if (final > CLOSE_THRESHOLD && !startedExpanded) {
          closeSheet();
          return;
        }
        if (g.dy < -EXPAND_THRESHOLD) {
          // Drag up enough → snap expanded
          Animated.spring(translateY, {
            toValue: expandedY,
            useNativeDriver: true,
            friction: 9,
            tension: 60,
          }).start();
          return;
        }
        if (startedExpanded && g.dy > COLLAPSE_THRESHOLD && g.dy <= CLOSE_THRESHOLD * 2) {
          // From expanded: moderate downward → snap back to collapsed
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 9,
            tension: 60,
          }).start();
          return;
        }
        if (startedExpanded && g.dy > CLOSE_THRESHOLD * 2) {
          closeSheet();
          return;
        }
        // No threshold crossed → snap back to wherever the gesture started.
        Animated.spring(translateY, {
          toValue: dragStartY.current,
          useNativeDriver: true,
          friction: 9,
          tension: 60,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: dragStartY.current,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const filtered = useMemo(() => {
    const sorted = [...COUNTRIES].sort((a, b) => {
      const aName = isFrench ? a.nameFr : a.name;
      const bName = isFrench ? b.nameFr : b.name;
      return aName.localeCompare(bName);
    });
    if (!query) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameFr.toLowerCase().includes(q),
    );
  }, [query, isFrench]);

  const toggle = (countryName) => {
    // Explicit blur of the search input — Keyboard.dismiss() alone left
    // the input "still focused" on some devices, causing the keyboard to
    // either flicker back or eat the next tap. Blurring the input AND
    // dismissing the keyboard is the belt-and-suspenders fix.
    searchInputRef.current?.blur?.();
    Keyboard.dismiss();
    if (selectedSet.has(countryName)) {
      onChange?.(selected.filter((s) => s !== countryName));
    } else {
      onChange?.([...selected, countryName]);
    }
  };

  const clearAll = () => onChange?.([]);

  const triggerLabel = selected.length === 0
    ? t('recipe.filters.origin.placeholder')
    : selected
        .map((s) => `${flagForOriginName(s)} ${localizedCountryName(s, localeMode)}`)
        .join(', ');

  return (
    <>
      {/* Wrapping View carries the ref so measure*() always works — past
          Pressable versions haven't reliably forwarded the View instance. */}
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={openSheet}
          accessibilityRole="button"
          accessibilityLabel={t('recipe.filters.origin.label')}
          accessibilityValue={{ text: triggerLabel }}
          style={[
            styles.trigger,
            {
              borderColor: css.input.borderColor,
              backgroundColor: css.input.bg,
              borderRadius: css.radius.md,
              paddingVertical: css.spacing.sm + 4,
              paddingHorizontal: css.spacing.md,
            },
          ]}
        >
          <Text
            numberOfLines={2}
            style={{
              flex: 1,
              color: selected.length === 0 ? css.palette.neutral500 : css.palette.neutral900,
              fontFamily: css.typography.fontUI,
              fontSize: css.typography.bodySize,
            }}
          >
            {triggerLabel}
          </Text>
          <FontAwesome
            name="chevron-down"
            size={14}
            color={css.palette.primary800}
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>

      <Modal
        visible={open}
        animationType="none"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeSheet}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop dim — opacity driven by a dedicated timing animation
            (425ms) instead of interpolating translateY. Decoupling the two
            lets the fade keep its own tempo regardless of how fast the
            sheet spring resolves, and matches the TagsMultiSelect feel.
            During drag-down before the close threshold, the backdrop
            stays at full opacity (no flicker); once `closeSheet()` fires,
            backdrop and sheet fade out in parallel. */}
        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor: css.palette.overlayDark,
              opacity: backdropOpacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                top: topOffset,
                // Height extends from the LOWEST possible top (collapsed) all
                // the way past the screen bottom, *including* the system
                // navigation bar / home indicator (insets.bottom). This way
                // transform translateY never reveals a gap below, and the
                // sheet always covers the sticky "Recipes >>" CTA on
                // RecapScreen — even on devices with a tall gesture bar.
                height: SCREEN_HEIGHT - EXPANDED_TOP + insets.bottom + 60,
                backgroundColor: css.palette.surfaceCard,
                transform: [{ translateY }],
              },
            ]}
          >
            {/* No KeyboardAvoidingView here — the sheet is anchored at the
                top (`topOffset`) and grows downward, so the iOS keyboard
                only ever overlaps the BOTTOM of the FlatList. KAV with
                behavior="padding" caused a single-tap-loss bug: tapping a
                row while the keyboard was up triggered the system keyboard
                dismiss; KAV then released its padding mid-touch, shifting
                the row downward between TouchDown and TouchUp, and the
                Touchable cancelled the press because TouchUp landed outside
                the row's new bounds. Result: keyboard closed, no selection
                → user has to tap again. Removing KAV keeps row geometry
                stable across the keyboard transition; the FlatList itself
                handles its overflow scrolling so the bottom rows remain
                reachable by scrolling. */}
            <View style={styles.kbAvoid}>
              {/* Dedicated drag zone: padding around the visual bar so the
                  user has a 40px-tall target to grab. */}
              <View
                style={styles.dragZone}
                {...panResponder.panHandlers}
              >
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: css.palette.neutral500 },
                  ]}
                />
              </View>

              <View style={[styles.sheetHeader, { paddingHorizontal: css.spacing.md }]}>
                <Text
                  style={{
                    fontFamily: css.typography.fontHeading,
                    fontSize: css.typography.h3Size,
                    color: css.palette.neutral900,
                  }}
                >
                  {t('recipe.filters.origin.title')}
                </Text>
                {selected.length > 0 && (
                  <Pressable
                    onPress={clearAll}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('recipe.filters.origin.clear')}
                  >
                    <Text
                      style={{
                        color: css.palette.primary800,
                        fontFamily: css.typography.fontUI,
                        fontSize: css.typography.bodySmSize,
                      }}
                    >
                      {t('recipe.filters.origin.clear')}
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={{ paddingHorizontal: css.spacing.md, flex: 1 }}>
                <TextInput
                  ref={searchInputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('recipe.filters.origin.searchPlaceholder')}
                  placeholderTextColor={css.palette.neutral500}
                  accessibilityLabel={t('recipe.filters.origin.searchPlaceholder')}
                  style={[
                    styles.search,
                    {
                      borderColor: css.input.borderColor,
                      color: css.palette.neutral900,
                      fontFamily: css.typography.fontBody,
                      fontSize: css.typography.bodySize,
                      borderRadius: css.radius.md,
                      marginBottom: css.spacing.md,
                    },
                  ]}
                  autoCorrect={false}
                  autoCapitalize="none"
                />

                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item.code}
                  // `"always"` lets every tap reach the row's `onPress` even
                  // when the keyboard is up, AND keeps the keyboard open
                  // across selections — exactly the desired UX. Earlier
                  // attempts with `"handled"` had the keyboard's auto-
                  // dismiss racing with the tap propagation (the system
                  // ate the first tap, the user had to tap twice). With
                  // `"always"`, the system never steals the tap.
                  keyboardShouldPersistTaps="always"
                  contentContainerStyle={{ paddingBottom: 16 }}
                  renderItem={({ item }) => {
                    const isSelected = selectedSet.has(item.name);
                    const display = isFrench ? item.nameFr : item.name;
                    return (
                      <TouchableOpacity
                        // `onPress` (not `onPressIn`) — onPressIn fires at
                        // touch-DOWN which makes scroll-start gestures look
                        // like selections. `onPress` waits until the user
                        // actually completes a tap (no scroll detected),
                        // matching standard list-selector behaviour.
                        onPress={() => toggle(item.name)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        style={[
                          styles.row,
                          {
                            backgroundColor: isSelected
                              ? css.palette.secondary300
                              : 'transparent',
                            borderRadius: css.radius.sm,
                          },
                        ]}
                      >
                        <Text style={styles.flag}>{flagEmoji(item.code)}</Text>
                        <Text
                          style={{
                            flex: 1,
                            color: css.palette.neutral900,
                            fontFamily: css.typography.fontUI,
                            fontSize: css.typography.bodySize,
                          }}
                        >
                          {display}
                        </Text>
                        {isSelected && (
                          <FontAwesome
                            name="check"
                            size={16}
                            color={css.palette.primary800}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlay: {
    flex: 1,
    // No backgroundColor — keep everything above the sheet visible.
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    // `bottom` is intentionally NOT set — we use a `height` larger than the
    // visible region (set inline) so dragging up never creates a gap below.
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  kbAvoid: {
    flex: 1,
  },
  // Drag zone is taller than the visible bar — 40px hit area centered on
  // the 4px bar so the user can grab it without precision-aiming.
  dragZone: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    opacity: 0.45,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  search: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flag: {
    fontSize: 22,
    marginRight: 10,
  },
});
