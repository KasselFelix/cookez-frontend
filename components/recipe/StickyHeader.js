import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import css from '../../styles/Global';

const HEADER_FADE_START = 120;
const HEADER_FADE_END = 240;
export const STICKY_HEADER_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

/**
 * StickyHeader
 * Glassmorphism header that fades in as the user scrolls past the hero image.
 *
 * @param {SharedValue<number>} scrollY — reanimated shared value
 * @param {string} title
 * @param {() => void} onBack
 * @param {() => void} [onHome]
 */
export default function StickyHeader({ scrollY, title, onBack, onHome }) {
  const insets = useSafeAreaInsets();
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_FADE_START, HEADER_FADE_END],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [HEADER_FADE_START, HEADER_FADE_END],
      [-8, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View pointerEvents="box-none" style={[styles.container, animatedStyle]}>
      <BlurView intensity={40} tint="light" style={[styles.blur, { paddingTop: insets.top }]}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <FontAwesome name="angle-left" size={28} color={css.palette.neutral900} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {onHome ? (
            <TouchableOpacity
              onPress={onHome}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Go to dashboard"
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <FontAwesome name="home" size={22} color={css.palette.neutral900} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  blur: {
    paddingBottom: css.spacing.sm,
    paddingHorizontal: css.spacing.md,
    backgroundColor: css.glassmorphism.backgroundColor,
    borderBottomWidth: css.glassmorphism.borderWidth,
    borderBottomColor: css.glassmorphism.borderColor,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: css.palette.neutral900,
    fontFamily: css.typography.fontHeading,
    fontSize: css.typography.h4Size,
    paddingHorizontal: css.spacing.sm,
  },
});
