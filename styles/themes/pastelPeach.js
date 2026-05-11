// ─────────────────────────────────────────────
// PASTEL PEACH — Joyful, early summer, lively
//
// Mood: cheerful, sunny, energetic — early summer morning.
// Use case: brunch recipes, fruit-based dishes, summer cocktails,
// celebratory or sharing content.
//
// Strategy:
//   - Peach DOMINATES (user request: "dominant joyeux"). Three tiers of
//     warm peach/amber so the entire screen reads "summer."
//   - Text: deep burnt brown (#2c1807) — paint-like, not synthetic black.
//   - Primary: deep amber (#c47d2e) so CTAs assert authority on warm bg.
//   - Accent: soft sage (#7fb8a9) — complementary cool tone creates that
//     "summer poolside" tension. Refreshing against the warmth.
//   - Shadows: tinted with deep amber so they belong to the theme instead
//     of producing a grey wash.
//   - SurfaceCard kept slightly tinted (not pure white) so the warmth
//     carries through to cards. Food photos still pop because the tint
//     is light enough.
// ─────────────────────────────────────────────
 
import css from '../Global';
 
const palette = {
  ...css.palette,
 
  // Surfaces — peach dominates
  background:  '#fde3b0', // dominant warm peach
  surface:     '#fef0d2', // medium peach — section backgrounds
  surfaceCard: '#fef8e8', // soft peach-cream — cards (food-photo friendly)
  overlay:     'rgba(44,24,7,0.55)',
  overlayLight:'rgba(255,255,255,0.5)',
  overlayDark: 'rgba(44,24,7,0.65)',
 
  // Deep amber primaries — confident CTAs on warm background
  primary800: '#c47d2e',
  primary700: '#d49845',
  primary600: '#e8a851',
  primary500: '#c47d2e',
 
  // Accent shifts to complementary sage — summer poolside contrast
  accent500: '#7fb8a9',
  accent400: '#a3cabf',
  accent300: '#c3dfd9',
  accent200: '#dbeae6',
 
  // Warm-tinted neutrals — paint feel instead of cold grey
  neutral900: '#2c1807', // deep burnt brown — primary text
  neutral700: '#5a3e10',
  neutral500: '#8b6a3a',
  neutral300: '#c9a17b',
  neutral200: '#e3c9a8',
  neutral100: '#f5e4cf',
};
 
const card = {
  ...css.card,
  bg:      palette.surfaceCard,
  tagBg:   '#fef0d2',
  tagText: palette.primary800,
};
 
const input = {
  ...css.input,
  bg:               palette.surfaceCard,
  borderColor:      palette.neutral300,
  borderColorFocus: palette.primary500,
  textColor:        palette.neutral900,
  placeholderColor: palette.neutral500,
  labelColor:       palette.neutral700,
};
 
const tabBar = {
  ...css.tabBar,
  backgroundColor:   'rgba(253,227,176,0.92)',
  activeTintColor:   palette.primary800,
  inactiveTintColor: palette.neutral500,
  indicatorBg:       '#fef0d2',
};
 
const button = {
  ...css.button,
  primaryBg:           palette.primary800,
  primaryBorderColor:  palette.primary800,
  primaryText:         css.palette.white,
  // Complementary cool accent — summer poolside feel
  accentBg:            palette.accent500,
  accentText:          css.palette.white,
  ghostText:           palette.primary800,
  ghostBorderColor:    palette.primary800,
  disabledBg:          palette.neutral200,
  disabledText:        palette.neutral500,
  disabledBorderColor: palette.neutral200,
};
 
// Shadows tinted with deep amber — integrate with peach surfaces
const shadow = {
  ...css.shadow,
  sm:   { ...css.shadow.sm,   shadowColor: '#5a3e10' },
  md:   { ...css.shadow.md,   shadowColor: '#5a3e10' },
  lg:   { ...css.shadow.lg,   shadowColor: '#5a3e10' },
  card: { ...css.shadow.card, shadowColor: '#5a3e10' },
};
 
const gradient = {
  ...css.gradient,
  hero: {
    colors: [palette.primary800, palette.primary600],
    locations: [0, 1],
  },
  accent: {
    colors: [`rgba(127,184,169,0)`, `rgba(127,184,169,0.9)`],
    locations: [0.3, 1],
  },
};
 
const glassmorphism = {
  ...css.glassmorphism,
  backgroundColor: 'rgba(254,240,210,0.88)',
  borderColor:     'rgba(255,255,255,0.4)',
};
 
// ─── Semantic layer remap ───
const text = {
  primary:   palette.neutral900,  // deep burnt brown
  secondary: palette.neutral700,
  muted:     palette.neutral500,
  inverse:   css.palette.white,
  accent:    palette.primary800,
  success:   palette.success,
  error:     palette.error,
  warning:   palette.warning,
};
 
const border = {
  subtle:  palette.neutral200,
  default: palette.neutral300,
  focus:   palette.primary500,
  error:   palette.error,
};
 
const surface = {
  base:    palette.background,
  raised:  palette.surface,
  card:    palette.surfaceCard,
  overlay: palette.overlay,
  glass:   'rgba(254,240,210,0.88)',
};
 
const elevation = {
  flat:     shadow.none,
  raised:   shadow.sm,
  card:     shadow.card,
  floating: shadow.md,
  modal:    shadow.lg,
};
 
const pastelPeach = {
  ...css,
  key: 'pastelPeach',
  mood: 'joyful, sunny, early-summer — for brunch, fruit dishes, summer cocktails',
 
  palette,
  card,
  input,
  tabBar,
  button,
  shadow,
  gradient,
  glassmorphism,
 
  // Semantic layer
  text,
  border,
  surface,
  elevation,
};
 
export default pastelPeach;