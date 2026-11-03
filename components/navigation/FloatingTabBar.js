// FloatingTabBar — Direction A: floating glass capsule.
// Replaces the default React Navigation tab bar via the `tabBar` prop on
// Tab.Navigator. Renders a detached pill at the bottom of the screen,
// blurs whatever is behind it, animates a "puck" behind the active icon,
// fires a light haptic on press. No labels by design.
//
// Hide behavior — if the focused route declares
// `options.tabBarStyle = { display: 'none' }`, we return null. This preserves
// the existing Kickoff behavior (camera screen takes the full viewport).
//
// Geometry — the wrapper paddingBottom math MUST stay in sync with
// hooks/useTabBarHeight.js so screens can compute the correct bottom padding.

import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  Home,
  MessageCircle,
  Plus,
  User,
} from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import {
  BAR_HEIGHT,
  BAR_MARGIN_BOTTOM,
  BAR_PADDING_HORIZONTAL,
} from '../../hooks/useTabBarHeight';

// Map route.name → Lucide icon component.
// Order in App.js Tab.Screen declarations:
//   UserDashboard, Kickoff, AddRecipe, Comment, Profile
const ROUTE_ICONS = {
  UserDashboard: Home,
  Kickoff: Camera,
  AddRecipe: Plus,
  Comment: MessageCircle,
  Profile: User,
};

const PUCK_SIZE = 40;
const ICON_SIZE = 22;

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const css = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();

  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key]?.options;
  // Honor `tabBarStyle: { display: 'none' }` on any focused screen.
  // Defensive against both an object and an array of styles.
  const tabBarStyle = focusedOptions?.tabBarStyle;
  const tabBarHidden = Array.isArray(tabBarStyle)
    ? tabBarStyle.some((s) => s && s.display === 'none')
    : tabBarStyle && tabBarStyle.display === 'none';

  const [innerWidth, setInnerWidth] = useState(0);
  const puckX = useSharedValue(0);

  const puckAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: puckX.value }],
  }));

  // Re-target the puck whenever the active index changes OR when we first
  // learn the row width (onLayout). Spring damping/stiffness chosen to feel
  // snappy without overshoot at this size (~iOS standard).
  useEffect(() => {
    if (innerWidth <= 0) return;
    const slot = innerWidth / state.routes.length;
    const target = state.index * slot + (slot - PUCK_SIZE) / 2;
    puckX.value = withSpring(target, { damping: 18, stiffness: 220 });
  }, [state.index, innerWidth, state.routes.length, puckX]);

  const handleLayout = (event) => {
    const width = event.nativeEvent.layout.width;
    if (width === innerWidth) return;
    setInnerWidth(width);
    // Snap immediately so the very first paint is correct (no animation
    // from x=0 to slot-0). The spring kicks in only on subsequent changes.
    const slot = width / state.routes.length;
    puckX.value = state.index * slot + (slot - PUCK_SIZE) / 2;
  };

  if (tabBarHidden) return null;

  // Theme-aware blur tint. The dark theme exposes `css.key === 'dark'`;
  // every other theme (light + pastels) reads as light.
  const blurTint = css.key === 'dark' ? 'dark' : 'light';

  // Some themes may not declare glassmorphism — fall back to a soft white
  // border so the capsule edge still reads on every background.
  const borderColor =
    (css.glassmorphism && css.glassmorphism.borderColor) ||
    'rgba(255,255,255,0.3)';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 8) + BAR_MARGIN_BOTTOM,
          paddingHorizontal: BAR_PADDING_HORIZONTAL,
        },
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            borderColor,
            // Slightly less than the full pill radius (99) so the capsule
            // reads as "rounded rectangle" instead of "tablet".
            borderRadius: 32,
          },
          css.shadow.lg,
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'android' ? 60 : 40}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.row} onLayout={handleLayout}>
          {innerWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.puck,
                {
                  backgroundColor: css.pill.bgSelected,
                  top: (BAR_HEIGHT - PUCK_SIZE) / 2,
                },
                puckAnimatedStyle,
              ]}
            />
          ) : null}
          {state.routes.map((route, index) => {
            const isActive = index === state.index;
            const Icon = ROUTE_ICONS[route.name];
            const color = isActive
              ? css.pill.textSelected
              : css.tabBar.inactiveTintColor;
            const a11yLabel = t(`tabBar.${routeKeyToI18n(route.name)}`);

            const onPress = () => {
              // Fire-and-forget light haptic. Catch swallows the rejection on
              // simulators/web where the native module is a no-op.
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.slot}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={a11yLabel}
                hitSlop={8}
              >
                {Icon ? <Icon size={ICON_SIZE} color={color} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// route.name uses PascalCase ('UserDashboard'); i18n keys use camelCase.
// Lowercasing the first character keeps the namespace tidy without a heavy
// dependency on a string-utils helper.
function routeKeyToI18n(routeName) {
  if (!routeName) return '';
  return routeName.charAt(0).toLowerCase() + routeName.slice(1);
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  pill: {
    height: BAR_HEIGHT,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    // Slots must sit above the puck — explicit zIndex avoids any z-order
    // surprise where the puck would intercept the touch on Android.
    zIndex: 1,
  },
  puck: {
    position: 'absolute',
    width: PUCK_SIZE,
    height: PUCK_SIZE,
    borderRadius: PUCK_SIZE / 2,
    zIndex: 0,
  },
});
