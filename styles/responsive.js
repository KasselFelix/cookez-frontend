// Responsive helpers — single source of truth for viewport-aware layout.
// Designed for Expo/React Native; safe on web (RNW) and tablets (Android/iPad).
//
// Breakpoints (width in dp/px):
//   sm  : <  360   (small phone, e.g. Galaxy A03 360x640)
//   md  : 360-413  (standard phone, e.g. iPhone 13 mini, Pixel 5)
//   lg  : 414-767  (large phone, e.g. iPhone 14 Pro Max 430)
//   xl  : >= 768   (tablet, e.g. iPad mini, Android tab 800x1280)
//
// Naming convention follows Tailwind/CSS conventions intentionally so that
// future contributors recognize the scale at a glance.

import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  sm: 360,
  md: 414,
  lg: 768,
};

// Reference widths used to interpolate fluid font sizes.
const FONT_REF_MIN_WIDTH = 360;
const FONT_REF_MAX_WIDTH = 768;

/**
 * Linear-clamp font scaling between min and max viewport widths.
 * Returns `min` for narrow screens, `max` for tablets, linearly
 * interpolated in between. Caller is responsible for `Math.round`
 * if integer pixel values are required.
 */
export function responsiveFontSize(min, max, width) {
  if (typeof width !== 'number' || Number.isNaN(width)) return min;
  if (width <= FONT_REF_MIN_WIDTH) return min;
  if (width >= FONT_REF_MAX_WIDTH) return max;
  const ratio = (width - FONT_REF_MIN_WIDTH) / (FONT_REF_MAX_WIDTH - FONT_REF_MIN_WIDTH);
  return Math.round(min + (max - min) * ratio);
}

/**
 * Default grid columns for a recipe-style grid.
 * 2 columns on phones, 3 columns on tablets.
 * Keep this in sync with Vague 1 spec.
 */
export function gridColumnsFor(width) {
  if (typeof width !== 'number' || Number.isNaN(width)) return 2;
  return width >= BREAKPOINTS.lg ? 3 : 2;
}

/**
 * Linear scale helper. On small phones, multiplies by 0.92.
 * On large phones, returns the value as-is. On tablets, multiplies by 1.08.
 * Use sparingly — prefer design tokens. Useful for hero/oversized elements.
 */
function makeScale(width) {
  return (value) => {
    if (typeof value !== 'number') return value;
    if (width < BREAKPOINTS.sm) return Math.round(value * 0.92);
    if (width >= BREAKPOINTS.lg) return Math.round(value * 1.08);
    return value;
  };
}

/**
 * useResponsive — single hook to read all viewport-derived values.
 * Re-renders on rotation / window resize via useWindowDimensions().
 *
 * @returns {{
 *   width: number,
 *   height: number,
 *   isSmallPhone: boolean,
 *   isLargePhone: boolean,
 *   isTablet: boolean,
 *   gridColumns: number,
 *   scale: (value: number) => number,
 * }}
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < BREAKPOINTS.sm;
  const isLargePhone = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isTablet = width >= BREAKPOINTS.lg;
  const gridColumns = gridColumnsFor(width);
  const scale = makeScale(width);

  return {
    width,
    height,
    isSmallPhone,
    isLargePhone,
    isTablet,
    gridColumns,
    scale,
  };
}

export default useResponsive;
