// Pastel Mint — soft sage-driven palette.
// Background dominates secondary300 (#d9ece8). Primary anchor moves to
// secondary500 (#abd1c6) so CTAs read as "soft sage" rather than deep teal.

import css from '../Global';

const palette = {
  ...css.palette,
  background:  '#d9ece8',
  surface:     '#edf6f4',
  surfaceCard: '#ffffff',

  // Primary swap — deeper sage tones
  primary800: '#7fb8a9',
  primary700: '#abd1c6',
  primary600: '#c3dfd9',
  primary500: '#abd1c6',
};

const card = {
  ...css.card,
  bg: palette.surfaceCard,
};

const tabBar = {
  ...css.tabBar,
  backgroundColor: 'rgba(217,236,232,0.92)',
  activeTintColor: '#7fb8a9',
};

const button = {
  ...css.button,
  primaryBg:          '#7fb8a9',
  primaryBorderColor: '#7fb8a9',
  accentBg:           css.palette.accent200,
  accentText:         '#7fb8a9',
  ghostText:          '#7fb8a9',
  ghostBorderColor:   '#7fb8a9',
};

const pastelMint = {
  ...css,
  key: 'pastelMint',
  palette,
  card,
  tabBar,
  button,
};

export default pastelMint;
