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

// Pills on dark : neutral uses the elevated charcoal surface, selected
// keeps the brand teal (already shifted to primary500/800 dark variants).
const pill = {
  ...css.pill,
  bgNeutral:    palette.surfaceCard, // #2a2a2c
  bgSelected:   palette.primary800,  // #33b5af (already overridden above)
  textNeutral:  palette.primary500,  // #009e97 accent teal
  textSelected: '#ffffff',
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
  imageOverlay: {
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
 
// Result screen: anthracite page like the Home tab, blue meter like the Home pills.
const result = {
  ...css.result,
  background: palette.surface,
  card:       palette.surfaceCard,
  ink:        palette.neutral900,
  muted:      palette.neutral700,
  meterFill:  pill.textNeutral,
  meterTrack: palette.surface,
};

// Ingredient flow: anthracite like the Home tab, light inks, grey buttons.
const flow = {
  ...css.flow,
  background:   palette.surface,             // #1c1c1e
  label:        palette.neutral700,
  chipText:     palette.neutral900,
  chipBorder:   palette.primary800,
  placeholder:  'rgba(255,255,255,0.3)',
  cardIcon:     palette.primary900,
  // Buttons like the Home pills: grey with blue ink (4.3:1).
  actionBg:     pill.bgNeutral,              // #2a2a2c
  actionIcon:   pill.textNeutral,            // #009e97
  actionText:   pill.textNeutral,
  clearIcon:    palette.error,               // 4.2:1 on actionBg
  shutterBg:    pill.bgNeutral,
  shutterRing:  pill.textNeutral,
  confirmBg:    palette.surfaceCard,         // charcoal pill, amber ink (8:1)
  confirmBorder:palette.accent500,
  confirmText:  palette.accent500,
  // Search modal: the page background, charcoal cards, picked rows teal with
  // deep ink (6.1:1).
  modalBg:          palette.surface,
  modalField:       palette.surfaceCard,
  modalInk:         palette.neutral900,
  modalMuted:       palette.neutral700,
  modalClear:       palette.neutral700,
  modalSelectedBg:  palette.primary800,
  modalSelectedInk: palette.primary900,
  modalSelectedText:palette.primary900,
  // Recap filters like the action buttons; idle tags on the page color.
  stepperBg:        pill.bgNeutral,
  stepperInk:       pill.textNeutral,
  tagBg:            pill.bgNeutral,
  tagInk:           pill.textNeutral,
  tagIdleBg:        palette.surface,
  tagIdleInk:       palette.neutral900,
  selectedBg:   palette.primary800,
  selectedText: palette.primary900,
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
  pill,
  flow,
  result,
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