// Dark theme — keeps brand primaries and inverts surfaces & neutrals.
//
// Strategy:
//   - Backgrounds: deep iOS-style charcoals (1c1c1e / 2c2c2e / 3a3a3c).
//   - Surfaces (cards, inputs, tab bar) shift to neutral700/800 tones.
//   - Neutral ramp inverted so neutral900 = light text, neutral100 = dark.
//   - Primary teal kept (#009e97 / #33b5af) but the *anchor* shifts to
//     primary500 because primary800 is too low-contrast on dark surfaces.
//   - Accents (amber) stay so warm CTAs remain warm.
//   - Shadows: switched to pure black with low opacity — Android elevation
//     still works, iOS shadow-on-dark is visually subtle by design.

import css from '../Global';

const palette = {
  ...css.palette,

  // Surfaces
  surface:      '#1c1c1e',
  surfaceCard:  '#2c2c2e',
  background:   '#161618',
  overlay:      'rgba(0,0,0,0.65)',
  overlayLight: 'rgba(255,255,255,0.08)',
  overlayDark:  'rgba(0,0,0,0.7)',

  // Inverted neutrals — keep semantic naming, swap meaning
  neutral900: '#f5f5f7', // = "primary text" on dark
  neutral700: '#d1d5db',
  neutral500: '#9ca3af',
  neutral300: '#4b5563',
  neutral200: '#3a3a3c',
  neutral100: '#2c2c2e',

  // Slightly cooler primaries pop better on dark surfaces
  primary800: '#33b5af', // anchor (legacy primary800 was too dark)
  primary700: '#33b5af',
};

const card = {
  ...css.card,
  bg:    palette.surfaceCard,
  tagBg: '#3a3a3c',
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
  primaryBg:          palette.primary500,
  primaryBorderColor: palette.primary500,
  ghostText:          palette.primary400,
  ghostBorderColor:   palette.primary400,
  disabledBg:         '#3a3a3c',
  disabledText:       palette.neutral500,
  disabledBorderColor:'#3a3a3c',
};

const shadow = {
  ...css.shadow,
  sm:   { ...css.shadow.sm,   shadowColor: '#000', shadowOpacity: 0.4 },
  md:   { ...css.shadow.md,   shadowColor: '#000', shadowOpacity: 0.5 },
  lg:   { ...css.shadow.lg,   shadowColor: '#000', shadowOpacity: 0.55 },
  card: { ...css.shadow.card, shadowColor: '#000', shadowOpacity: 0.45 },
};

const glassmorphism = {
  ...css.glassmorphism,
  backgroundColor: 'rgba(28,28,30,0.88)',
  borderColor:     'rgba(255,255,255,0.08)',
};

const dark = {
  ...css,
  key: 'dark',
  palette,
  card,
  input,
  tabBar,
  button,
  shadow,
  glassmorphism,
};

export default dark;
