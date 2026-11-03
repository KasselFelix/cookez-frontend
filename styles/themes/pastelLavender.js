// ─────────────────────────────────────────────
// PASTEL LAVENDER — Spring, subtle, artistic
//
// Mood: refined, painted, spring afternoon — incredibly beautiful and subtle.
// Use case: delicate dishes, desserts, plated cuisine, mindful eating
// content. The most editorial of the themes.
//
// Strategy:
//   - Dusty lavender dominates — slightly desaturated so it reads as
//     painted, not synthetic.
//   - Text: deep aubergine (#2c1e3e) instead of pure black — keeps the
//     paint-like quality.
//   - Primary: deep amethyst (#6b5a9c) — confident enough for CTAs without
//     breaking the refined mood.
//   - Accent: soft warm cream (#f5dfb8) — complementary warmth gives the
//     lavender something to breathe against. Editorial, never garish.
//   - Shadows: tinted with deep aubergine for that "watercolor depth."
// ─────────────────────────────────────────────
 
import css from '../Global';
 
const palette = {
  ...css.palette,
 
  // Surfaces — dusty lavender dominates
  background:  '#c7b8e8', // dominant dusty lavender
  surface:     '#dccff0', // medium lavender — section backgrounds
  surfaceCard: '#f0eaf7', // soft lavender-white — cards
  overlay:     'rgba(44,30,62,0.55)',
  overlayLight:'rgba(255,255,255,0.5)',
  overlayDark: 'rgba(44,30,62,0.65)',
 
  // Deep amethyst primaries — refined authority for CTAs
  primary800: '#6b5a9c',
  primary700: '#7a6cae',
  primary600: '#8a7cbb',
  primary500: '#6b5a9c',
 
  // Soft cream accent — complementary warmth
  accent500: '#f5dfb8',
  accent400: '#f9e8cc',
  accent300: '#fcefdb',
  accent200: '#fef6eb',
 
  // Aubergine-tinted neutrals — paint feel
  neutral900: '#2c1e3e', // deep aubergine — primary text
  neutral700: '#4d3d65',
  neutral500: '#7a6e8c',
  neutral300: '#b8aec8',
  neutral200: '#d3cbe0',
  neutral100: '#ebe5f0',
};
 
const card = {
  ...css.card,
  bg:      palette.surfaceCard,
  tagBg:   '#dccff0',
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
  backgroundColor:   'rgba(199,184,232,0.92)',
  activeTintColor:   palette.primary800,
  inactiveTintColor: palette.neutral500,
  indicatorBg:       '#dccff0',
};
 
const button = {
  ...css.button,
  primaryBg:           palette.primary800,
  primaryBorderColor:  palette.primary800,
  primaryText:         css.palette.white,
  // Soft cream accent — complementary warm tone
  accentBg:            palette.accent500,
  accentText:          palette.neutral900,
  ghostText:           palette.primary800,
  ghostBorderColor:    palette.primary800,
  disabledBg:          palette.neutral200,
  disabledText:        palette.neutral500,
  disabledBorderColor: palette.neutral200,
};

const pill = {
  ...css.pill,
  bgNeutral:   palette.neutral100, // #ebe5f0 — pale aubergine-tinted, on-mood
  bgSelected:  palette.primary800,
  textNeutral: palette.primary800,
};
 
// Shadows tinted with deep aubergine — watercolor depth
const shadow = {
  ...css.shadow,
  sm:   { ...css.shadow.sm,   shadowColor: '#2c1e3e' },
  md:   { ...css.shadow.md,   shadowColor: '#2c1e3e' },
  lg:   { ...css.shadow.lg,   shadowColor: '#2c1e3e' },
  card: { ...css.shadow.card, shadowColor: '#2c1e3e' },
};
 
const gradient = {
  ...css.gradient,
  hero: {
    colors: [palette.primary800, palette.primary600],
    locations: [0, 1],
  },
  accent: {
    colors: [`rgba(245,223,184,0)`, `rgba(245,223,184,0.9)`],
    locations: [0.3, 1],
  },
};
 
const glassmorphism = {
  ...css.glassmorphism,
  backgroundColor: 'rgba(220,207,240,0.88)',
  borderColor:     'rgba(255,255,255,0.4)',
};
 
// ─── Semantic layer remap ───
const text = {
  primary:   palette.neutral900,  // deep aubergine
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
  glass:   'rgba(220,207,240,0.88)',
};
 
const elevation = {
  flat:     shadow.none,
  raised:   shadow.sm,
  card:     shadow.card,
  floating: shadow.md,
  modal:    shadow.lg,
};
 
const pastelLavender = {
  ...css,
  key: 'pastelLavender',
  mood: 'refined, painted, spring-afternoon — for delicate dishes, desserts, editorial content',
 
  palette,
  card,
  input,
  tabBar,
  button,
  pill,
  shadow,
  gradient,
  glassmorphism,
 
  // Semantic layer
  text,
  border,
  surface,
  elevation,
};
 
export default pastelLavender;
