// ─────────────────────────────────────────────
// DARK — Eye-comfort, elegance, calm
//
// Mood: relaxed atmosphere, practical, readable, refined.
// Use case: evening reading, low-light environments, users who
// prioritize comfort over visual energy.
//
// Strategy:
//   - Backgrounds: soft iOS-style charcoals (not pure black — too harsh).
//   - Primary text: off-white (#e8e8eb) instead of pure white to reduce
//     eye strain on long reads.
//   - Brand teal kept but the anchor shifts to primary500 (#009e97);
//     primary800 is too low-contrast on dark surfaces.
//   - Shadows: pure black with high opacity to preserve depth on dark UI.
//   - Accents: amber kept — warm CTAs stay warm even on cool dark surfaces.
// ─────────────────────────────────────────────
 
import css from '../Global';
 
const palette = {
  ...css.palette,
 
  // Surfaces — soft charcoals (never pure black)
  background:   '#161618',
  surface:      '#1c1c1e',
  surfaceCard:  '#2a2a2c',
  overlay:      'rgba(0,0,0,0.65)',
  overlayLight: 'rgba(255,255,255,0.08)',
  overlayDark:  'rgba(0,0,0,0.7)',
 
  // Inverted neutrals — keep semantic naming, swap meaning
  neutral900: '#e8e8eb', // primary text — off-white for eye comfort
  neutral700: '#c7c7cc', // secondary text
  neutral500: '#8e8e93', // muted text
  neutral300: '#48484a', // borders
  neutral200: '#3a3a3c', // subtle dividers
  neutral100: '#2c2c2e', // raised surfaces
 
  // Brand primaries — shift to primary500 anchor for contrast
  primary800: '#33b5af',
  primary700: '#33b5af',
  primary600: '#009e97',
  primary500: '#009e97',
};
 
const card = {
  ...css.card,
  bg:    palette.surfaceCard,
  tagBg: '#3a3a3c',
  tagText: palette.primary400,
};
 
const input = {
  ...css.input,
  bg:               palette.surface,
  borderColor:      '#3a3a3c',
  borderColorFocus: palette.primary500,
  textColor:        palette.neutral900,
  placeholderColor: palette.neutral500,
  labelColor:       palette.neutral700,
};
 
const tabBar = {
  ...css.tabBar,
  backgroundColor:   'rgba(28,28,30,0.92)',
  activeTintColor:   palette.primary500,
  inactiveTintColor: palette.neutral500,
  indicatorBg:       '#3a3a3c',
};
 
const button = {
  ...css.button,
  primaryBg:           palette.primary500,
  primaryBorderColor:  palette.primary500,
  ghostText:           palette.primary400,
  ghostBorderColor:    palette.primary400,
  disabledBg:          '#3a3a3c',
  disabledText:        palette.neutral500,
  disabledBorderColor: '#3a3a3c',
};
 
// Shadows on dark: pure black, high opacity for visible depth
const shadow = {
  ...css.shadow,
  sm:   { ...css.shadow.sm,   shadowColor: '#000', shadowOpacity: 0.4 },
  md:   { ...css.shadow.md,   shadowColor: '#000', shadowOpacity: 0.5 },
  lg:   { ...css.shadow.lg,   shadowColor: '#000', shadowOpacity: 0.55 },
  card: { ...css.shadow.card, shadowColor: '#000', shadowOpacity: 0.45 },
};
 
// Gradients adapted to dark surfaces
const gradient = {
  ...css.gradient,
  hero: {
    colors: [palette.primary600, palette.primary400],
    locations: [0, 1],
  },
  staffPicks: {
    colors: ['transparent', 'rgba(0,0,0,0.85)'],
    locations: [0.4, 1],
  },
};
 
const glassmorphism = {
  ...css.glassmorphism,
  backgroundColor: 'rgba(28,28,30,0.88)',
  borderColor:     'rgba(255,255,255,0.08)',
};
 
// ─── Semantic layer remap ───
const text = {
  primary:   palette.neutral900,  // off-white
  secondary: palette.neutral700,
  muted:     palette.neutral500,
  inverse:   palette.neutral100,  // dark text on light bg (rare in dark mode)
  accent:    palette.primary400,
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
  glass:   'rgba(28,28,30,0.88)',
};
 
const elevation = {
  flat:     shadow.none,
  raised:   shadow.sm,
  card:     shadow.card,
  floating: shadow.md,
  modal:    shadow.lg,
};
 
const dark = {
  ...css,
  key: 'dark',
  mood: 'relaxed, elegant, eye-soothing — for evening use and low-light environments',
 
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
 
export default dark;