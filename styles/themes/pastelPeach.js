// Pastel Peach — warm amber-driven palette.
// Background dominates accent300 (#fde3b0). Primary moves to accent500.

import css from '../Global';

const palette = {
  ...css.palette,
  background:  '#fde3b0',
  surface:     '#fef3db',
  surfaceCard: '#fffaf2',

  primary800: '#d49845',
  primary700: '#e8a851',
  primary600: '#f4b85e',
  primary500: '#f9bc60',
};

const card = {
  ...css.card,
  bg: palette.surfaceCard,
};

const tabBar = {
  ...css.tabBar,
  backgroundColor: 'rgba(253,227,176,0.92)',
  activeTintColor: '#d49845',
};

const button = {
  ...css.button,
  primaryBg:          '#d49845',
  primaryBorderColor: '#d49845',
  accentBg:           '#f9bc60',
  accentText:         '#5a3e10',
  ghostText:          '#d49845',
  ghostBorderColor:   '#d49845',
};

const pastelPeach = {
  ...css,
  key: 'pastelPeach',
  palette,
  card,
  tabBar,
  button,
};

export default pastelPeach;
