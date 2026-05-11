// ─────────────────────────────────────────────
// PASTEL MINT — Cool, fresh, winter
//
// Mood: refreshing, frosty, calm winter morning.
// Use case: cold dishes, summer drinks, breakfast bowls, salads.
//
// Strategy:
//   - Mint dominates: three tiers of mint (deep → medium → soft) so the
//     theme actually feels mint, not "white with a mint accent."
//   - Text: deep teal-charcoal (#1a2e2a) instead of pure black for that
//     "frosted glass" feel — colors read as painted, not ink.
//   - Primary: deeper sage (#5fa394) so CTAs have authority on light bg.
//   - Accent: amber kept (warm CTA on cool background creates intentional
//     contrast — like a fireplace in a snowy room).
//   - Shadows: tinted with deep teal (#0a2e2a) so they integrate with the
//     mint surfaces instead of producing a generic grey.
// ─────────────────────────────────────────────
 
import css from '../Global';
 
const palette = {
  ...css.palette,
 
  // Surfaces — mint dominates (no pure white)
  background:  '#b8dcd0', // deep cool mint — the dominant tone
  surface:     '#d9ece8', // medium mint — section backgrounds
  surfaceCard: '#f0f7f4', // soft mint-white — cards (still readable for photos)
  overlay:     'rgba(26,46,42,0.55)',
  overlayLight:'rgba(255,255,255,0.5)',
  overlayDark: 'rgba(26,46,42,0.65)',
 
  // Deeper sage primaries — CTAs read with authority
  primary800: '#5fa394',
  primary700: '#7fb8a9',
  primary600: '#abd1c6',
  primary500: '#5fa394',
 
  // Slightly cooler neutrals for the frosted feel
  neutral900: '#1a2e2a', // deep teal-charcoal — primary text
  neutral700: '#3a5752',
  neutral500: '#6b8782',
  neutral300: '#a8c0bb',
  neutral200: '#c5d8d3',
  neutral100: '#e0ebe7',
};
 
const card = {
  ...css.card,
  bg:      palette.surfaceCard,
  tagBg:   '#d9ece8',
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
  backgroundColor:   'rgba(217,236,232,0.92)',
  activeTintColor:   palette.primary800,
  inactiveTintColor: palette.neutral500,
  indicatorBg:       '#c5d8d3',
};
 
const button = {
  ...css.button,
  primaryBg:          palette.primary800,
  primaryBorderColor: palette.primary800,
  primaryText:        css.palette.white,
  // Warm accent stays — intentional contrast
  accentBg:           css.palette.accent500,
  accentText:         palette.neutral900,
  ghostText:          palette.primary800,
  ghostBorderColor:   palette.primary800,
  disabledBg:         palette.neutral200,
  disabledText:       palette.neutral500,
  disabledBorderColor:palette.neutral200,
};
 
// Shadows tinted with deep teal — integrate with mint surfaces
const shadow = {
  ...css.shadow,
  sm:   { ...css.shadow.sm,   shadowColor: '#0a2e2a' },
  md:   { ...css.shadow.md,   shadowColor: '#0a2e2a' },
  lg:   { ...css.shadow.lg,   shadowColor: '#0a2e2a' },
  card: { ...css.shadow.card, shadowColor: '#0a2e2a' },
};
 
const gradient = {
  ...css.gradient,
  hero: {
    colors: [palette.primary800, palette.primary600],
    locations: [0, 1],
  },
};
 
const glassmorphism = {
  ...css.glassmorphism,
  backgroundColor: 'rgba(217,236,232,0.88)',
  borderColor:     'rgba(255,255,255,0.4)',
};
 
// ─── Semantic layer remap ───
const text = {
  primary:   palette.neutral900,  // deep teal-charcoal
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
  glass:   'rgba(217,236,232,0.88)',
};
 
const elevation = {
  flat:     shadow.none,
  raised:   shadow.sm,
  card:     shadow.card,
  floating: shadow.md,
  modal:    shadow.lg,
};
 
const pastelMint = {
  ...css,
  key: 'pastelMint',
  mood: 'cool, fresh, winter-morning — for cold dishes, summer drinks, breakfast bowls',
 
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
 
export default pastelMint;
 
